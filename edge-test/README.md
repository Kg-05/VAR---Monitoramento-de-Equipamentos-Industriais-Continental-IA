# Teste MVP — deteção de lanterna via webcam

Protótipo do Dia 1-4 do plano de testes: prova que o circuito **câmara → deteção → `POST /alertas` → VAR** funciona de ponta a ponta, sem depender de um modelo de IA treinado. Usa a lanterna de um iPhone como sinal de teste (proxy de um LED de falha num equipamento real).

## 1. Preparar o ambiente Python (no portátil, Windows)

```powershell
cd edge-test
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## 2. Criar uma empresa/equipamento de teste no VAR

Entra no VAR como ADM ou Operacional e:
1. Cria (ou usa uma já existente) uma empresa — ex: uma das do seed, tipo "Sonangol Refinaria Luanda".
2. Cria um equipamento nessa empresa (ex: nome "Câmara de teste — Portátil", localização "Laboratório").
3. Copia o **ID da empresa** e o **ID do equipamento** — dá para ver na URL/detalhe, ou consultando `GET /api/v1/equipamentos` e `GET /api/v1/empresas`.

## 3. Configurar o script

Abre `flashlight_monitor.py` e edita:
- `API_URL` — o domínio do backend (Railway em produção, ou `http://localhost:3333/api/v1` se estiveres a testar contra o backend local).
- `LOGIN_EMAIL` / `LOGIN_SENHA` — usa uma conta Operacional ou ADM sem 2FA ativo (as do seed servem: `operacional@sistema.ao` / `Oper@123`).
- `EQUIPAMENTO_ID` / `EMPRESA_ID` — os que copiaste no passo 2.

## 4. Correr e calibrar

```powershell
python flashlight_monitor.py
```

- Abre uma janela com a imagem da webcam e um retângulo verde (a ROI).
- Nos primeiros 3 segundos, **mantém a lanterna apagada** e o telemóvel fora da ROI ou virado para baixo — é a calibração do brilho ambiente.
- Depois disso, posiciona o telemóvel com a lanterna apontada para dentro do retângulo verde e acende-a — ao fim de alguns frames (± meio segundo) deve aparecer "ALERTA" no ecrã e o pedido `POST /alertas` é enviado. Confirma no dashboard do VAR (Operacional → Gerir Alertas, ou Cliente → Alertas da empresa escolhida).
- Prime `q` para sair.

## 5. Afinar se necessário

- **Retângulo mal posicionado**: ajusta `ROI = (x, y, largura, altura)` no script — os valores são em pixels a partir do canto superior esquerdo da imagem da webcam.
- **Não deteta / deteta a mais**: ajusta `LIMIAR_DELTA` (mais alto = precisa de mais brilho para disparar) — sobe se estiver a disparar sozinho com a luz ambiente a mudar, desce se não estiver a detetar a lanterna.
- **Alertas repetidos demasiado próximos**: aumenta `COOLDOWN_SEGUNDOS`.
- **Falsos positivos por flicker/reflexo rápido**: aumenta `FRAMES_CONFIRMACAO`.

## Próximos passos (fora do âmbito desta semana)

Isto valida o pipeline, não a deteção "real". Para produção seria preciso: câmara fixa apontada ao equipamento real, um sinal genuíno de falha (LED do painel, vibração, temperatura), dataset rotulado se for necessário um classificador, e um mecanismo de autenticação próprio para dispositivos (API key por equipamento, em vez de login humano) — ver conversa sobre este ponto.
