"""
Protótipo de teste MVP — deteção de "lanterna acesa/apagada" via webcam,
usada como proxy de um indicador de falha (LED de estado) num equipamento
industrial real. Sem modelo treinado: deteção por brilho médio numa região
fixa da imagem (ROI), com calibração automática e debounce.

Fluxo:
  1. Login no VAR (obtém JWT).
  2. Pede o Nome da Empresa e o ID do Equipamento a monitorizar, e
     confirma contra a API que o equipamento pertence mesmo a essa
     empresa antes de começar (evita enviar alertas para o par errado).
  3. Calibra o brilho "ambiente" (lanterna apagada) durante alguns segundos.
  4. Por cada frame, mede o brilho médio dentro da ROI e compara com a
     calibração. Ao detetar transição apagado -> aceso, sustentada por
     alguns frames seguidos (evita falso positivo por reflexo/flicker),
     envia um alerta para POST /api/v1/alertas — o nível escala com o
     número de deteções nesta sessão: 1-2 = razoavel, 3-5 = medio,
     6+ = critico.

Uso:
    python -m venv .venv && .venv\\Scripts\\activate   (Windows)
    pip install -r requirements.txt
    python flashlight_monitor.py
"""

import sys
import time
from dataclasses import dataclass

import cv2
import numpy as np
import requests

# ── Configuração — ajusta antes de correr ────────────────────────────────

API_URL = "https://var-mvp-continental.up.railway.app/api/v1"  # ou http://localhost:3333/api/v1 em dev

# Conta de teste (ADM ou Operacional — ver README neste diretório para criar uma)
LOGIN_EMAIL = "operacional@sistema.ao"
LOGIN_SENHA = "Oper@123"

# Empresa e equipamento já não são fixos aqui — o script pergunta-os no
# arranque (nome da empresa + ID do equipamento) e confirma contra a API
# que o equipamento pertence mesmo a essa empresa. Ver escolher_equipamento().

CAMERA_INDEX = 0  # 0 = webcam padrão do portátil

# Região de interesse (x, y, largura, altura) em pixels — a zona da imagem
# onde vais posicionar o telemóvel. Ajusta depois de veres o preview.
ROI = (260, 180, 120, 120)

LIMIAR_DELTA       = 60   # quanto o brilho médio tem de subir acima da calibração para contar como "aceso"
FRAMES_CONFIRMACAO = 5    # frames seguidos acima do limiar antes de confirmar a transição (debounce)
COOLDOWN_SEGUNDOS  = 15   # tempo mínimo entre alertas enviados, mesmo que continue aceso/apagado a piscar

# Nível do alerta escala com o número de deteções confirmadas nesta sessão
# (não é fixo) — reflete uma anomalia que se repete como mais grave do que
# uma ocorrência isolada.
LIMIAR_NIVEL_MEDIO   = 3  # a partir da 3ª deteção
LIMIAR_NIVEL_CRITICO = 6  # a partir da 6ª deteção

DESCRICAO_ALERTA = "Anomalia detetada pelo sensor de câmara (teste MVP — lanterna)"


def nivel_por_contagem(contagem: int) -> str:
    if contagem >= LIMIAR_NIVEL_CRITICO:
        return "critico"
    if contagem >= LIMIAR_NIVEL_MEDIO:
        return "medio"
    return "razoavel"


# ── Estado ────────────────────────────────────────────────────────────────

@dataclass
class Estado:
    calibrado: bool = False
    baseline: float = 0.0
    aceso: bool = False
    frames_acima: int = 0
    frames_abaixo: int = 0
    ultimo_alerta_em: float = 0.0
    total_deteccoes: int = 0  # nº de alertas confirmados enviados nesta sessão


def obter_token() -> str:
    resp = requests.post(f"{API_URL}/auth/login", json={"email": LOGIN_EMAIL, "senha": LOGIN_SENHA}, timeout=10)
    resp.raise_for_status()
    dados = resp.json()["data"]
    if dados.get("totpRequerido"):
        raise RuntimeError("Esta conta tem 2FA ativo — usa uma conta de teste sem 2FA para este script.")
    return dados["token"]


def escolher_equipamento(token: str) -> tuple[str, str, str]:
    """Pede o Nome da Empresa e o ID do Equipamento, e confirma contra a
    API que o equipamento pertence mesmo a essa empresa antes de começar
    — evita enviar alertas para o par empresa/equipamento errado.
    Devolve (equipamento_id, empresa_id, equipamento_nome)."""
    headers = {"Authorization": f"Bearer {token}"}

    nome_empresa = input("Nome da empresa: ").strip()
    if not nome_empresa:
        raise RuntimeError("Nome da empresa não pode ficar vazio.")

    resp = requests.get(f"{API_URL}/empresas", params={"search": nome_empresa, "limit": 5}, headers=headers, timeout=10)
    resp.raise_for_status()
    empresas = resp.json()["data"]
    if not empresas:
        raise RuntimeError(f"Nenhuma empresa encontrada com o nome '{nome_empresa}'.")
    if len(empresas) > 1:
        print("Mais do que uma empresa encontrada:")
        for e in empresas:
            print(f"  - {e['nome']}  (id: {e['id']})")
        raise RuntimeError("Sê mais específico no nome da empresa e corre o script outra vez.")
    empresa = empresas[0]
    print(f"Empresa: {empresa['nome']} (id: {empresa['id']})")

    equipamento_id = input("ID (UUID) do equipamento a monitorizar: ").strip()
    if not equipamento_id:
        raise RuntimeError("ID do equipamento não pode ficar vazio.")

    resp = requests.get(f"{API_URL}/equipamentos/{equipamento_id}", headers=headers, timeout=10)
    if resp.status_code == 404:
        raise RuntimeError(f"Equipamento '{equipamento_id}' não encontrado.")
    resp.raise_for_status()
    equipamento = resp.json()["data"]

    if equipamento["empresa"]["id"] != empresa["id"]:
        raise RuntimeError(
            f"O equipamento '{equipamento['nome']}' pertence a '{equipamento['empresa']['nome']}', "
            f"não a '{empresa['nome']}'. Confirma o ID."
        )

    print(f"Equipamento: {equipamento['nome']} (id: {equipamento['id']}) — confirmado.")
    return equipamento["id"], empresa["id"], equipamento["nome"]


def enviar_alerta(token: str, equipamento_id: str, empresa_id: str, descricao: str, nivel: str) -> None:
    try:
        resp = requests.post(
            f"{API_URL}/alertas",
            json={
                "equipamentoId": equipamento_id,
                "empresaId":     empresa_id,
                "descricao":     descricao,
                "nivel":         nivel,
            },
            headers={"Authorization": f"Bearer {token}"},
            timeout=10,
        )
        resp.raise_for_status()
        print(f"[ALERTA ENVIADO] {descricao} ({nivel})")
    except requests.RequestException as e:
        print(f"[ERRO AO ENVIAR ALERTA] {e}")


def brilho_medio(frame, roi) -> float:
    x, y, w, h = roi
    recorte = frame[y:y + h, x:x + w]
    cinza = cv2.cvtColor(recorte, cv2.COLOR_BGR2GRAY)
    return float(np.mean(cinza))


def main() -> None:
    print("A autenticar no VAR...")
    token = obter_token()
    print("Autenticado.")

    equipamento_id, empresa_id, equipamento_nome = escolher_equipamento(token)

    # No Windows, CAP_DSHOW evita atrasos/frames pretos ao abrir a webcam.
    backend = cv2.CAP_DSHOW if sys.platform.startswith("win") else cv2.CAP_ANY
    cam = cv2.VideoCapture(CAMERA_INDEX, backend)
    if not cam.isOpened():
        raise RuntimeError("Não foi possível abrir a câmara. Confirma o CAMERA_INDEX.")

    estado = Estado()
    amostras_calibracao = []
    inicio_calibracao = time.time()

    print("A calibrar o brilho ambiente — mantém a lanterna APAGADA por 3 segundos...")

    while True:
        ok, frame = cam.read()
        if not ok:
            print("[AVISO] Falha a ler frame da câmara, a tentar novamente...")
            continue

        x, y, w, h = ROI
        cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)

        if not estado.calibrado:
            amostras_calibracao.append(brilho_medio(frame, ROI))
            if time.time() - inicio_calibracao >= 3:
                estado.baseline = float(np.mean(amostras_calibracao))
                estado.calibrado = True
                print(f"Calibração concluída. Brilho ambiente = {estado.baseline:.1f}. A monitorizar...")
            cv2.imshow("VAR - teste (a calibrar)", frame)
            if cv2.waitKey(1) & 0xFF == ord("q"):
                break
            continue

        brilho = brilho_medio(frame, ROI)
        acima_do_limiar = brilho >= estado.baseline + LIMIAR_DELTA

        if acima_do_limiar:
            estado.frames_acima += 1
            estado.frames_abaixo = 0
        else:
            estado.frames_abaixo += 1
            estado.frames_acima = 0

        agora = time.time()
        em_cooldown = (agora - estado.ultimo_alerta_em) < COOLDOWN_SEGUNDOS

        # Transição apagado -> aceso, confirmada
        if not estado.aceso and estado.frames_acima >= FRAMES_CONFIRMACAO:
            estado.aceso = True
            if not em_cooldown:
                estado.total_deteccoes += 1
                nivel = nivel_por_contagem(estado.total_deteccoes)
                descricao = f"{DESCRICAO_ALERTA} — deteção nº{estado.total_deteccoes} em {equipamento_nome}"
                enviar_alerta(token, equipamento_id, empresa_id, descricao, nivel)
                estado.ultimo_alerta_em = agora

        # Transição aceso -> apagado, confirmada (só atualiza estado local, sem novo alerta)
        if estado.aceso and estado.frames_abaixo >= FRAMES_CONFIRMACAO:
            estado.aceso = False
            print("[INFO] Sinal voltou ao normal.")

        cor_status = (0, 0, 255) if estado.aceso else (0, 255, 0)
        texto = (
            f"Brilho: {brilho:.0f} (base {estado.baseline:.0f})  "
            f"Estado: {'ALERTA' if estado.aceso else 'normal'}  "
            f"Deteções: {estado.total_deteccoes} ({nivel_por_contagem(estado.total_deteccoes) if estado.total_deteccoes else '-'})"
        )
        cv2.putText(frame, texto, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, cor_status, 2)
        cv2.imshow("VAR - teste (lanterna)", frame)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cam.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
