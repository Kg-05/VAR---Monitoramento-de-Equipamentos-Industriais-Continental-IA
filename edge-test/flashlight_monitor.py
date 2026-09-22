"""
Protótipo de teste MVP — deteção de "lanterna acesa/apagada" via webcam,
usada como proxy de um indicador de falha (LED de estado) num equipamento
industrial real. Sem modelo treinado: deteção por brilho médio numa região
fixa da imagem (ROI), com calibração automática e debounce.

Fluxo:
  1. Login no VAR (obtém JWT).
  2. Calibra o brilho "ambiente" (lanterna apagada) durante alguns segundos.
  3. Por cada frame, mede o brilho médio dentro da ROI e compara com a
     calibração. Ao detetar transição apagado -> aceso, sustentada por
     alguns frames seguidos (evita falso positivo por reflexo/flicker),
     envia um alerta para POST /api/v1/alertas.

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

# IDs do equipamento/empresa de teste (cria-os primeiro pela interface do VAR
# — ver README) — o alerta fica associado a este par.
EQUIPAMENTO_ID = "COLOCA-AQUI-O-UUID-DO-EQUIPAMENTO"
EMPRESA_ID     = "COLOCA-AQUI-O-UUID-DA-EMPRESA"

CAMERA_INDEX = 0  # 0 = webcam padrão do portátil

# Região de interesse (x, y, largura, altura) em pixels — a zona da imagem
# onde vais posicionar o telemóvel. Ajusta depois de veres o preview.
ROI = (260, 180, 120, 120)

LIMIAR_DELTA       = 60   # quanto o brilho médio tem de subir acima da calibração para contar como "aceso"
FRAMES_CONFIRMACAO = 5    # frames seguidos acima do limiar antes de confirmar a transição (debounce)
COOLDOWN_SEGUNDOS  = 15   # tempo mínimo entre alertas enviados, mesmo que continue aceso/apagado a piscar

NIVEL_ALERTA = "critico"  # razoavel | medio | critico
DESCRICAO_ALERTA = "Anomalia detetada pelo sensor de câmara (teste MVP — lanterna)"


# ── Estado ────────────────────────────────────────────────────────────────

@dataclass
class Estado:
    calibrado: bool = False
    baseline: float = 0.0
    aceso: bool = False
    frames_acima: int = 0
    frames_abaixo: int = 0
    ultimo_alerta_em: float = 0.0


def obter_token() -> str:
    resp = requests.post(f"{API_URL}/auth/login", json={"email": LOGIN_EMAIL, "senha": LOGIN_SENHA}, timeout=10)
    resp.raise_for_status()
    dados = resp.json()["data"]
    if dados.get("totpRequerido"):
        raise RuntimeError("Esta conta tem 2FA ativo — usa uma conta de teste sem 2FA para este script.")
    return dados["token"]


def enviar_alerta(token: str, descricao: str, nivel: str) -> None:
    try:
        resp = requests.post(
            f"{API_URL}/alertas",
            json={
                "equipamentoId": EQUIPAMENTO_ID,
                "empresaId":     EMPRESA_ID,
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
                enviar_alerta(token, DESCRICAO_ALERTA, NIVEL_ALERTA)
                estado.ultimo_alerta_em = agora

        # Transição aceso -> apagado, confirmada (só atualiza estado local, sem novo alerta)
        if estado.aceso and estado.frames_abaixo >= FRAMES_CONFIRMACAO:
            estado.aceso = False
            print("[INFO] Sinal voltou ao normal.")

        cor_status = (0, 0, 255) if estado.aceso else (0, 255, 0)
        texto = f"Brilho: {brilho:.0f} (base {estado.baseline:.0f})  Estado: {'ALERTA' if estado.aceso else 'normal'}"
        cv2.putText(frame, texto, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, cor_status, 2)
        cv2.imshow("VAR - teste (lanterna)", frame)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cam.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
