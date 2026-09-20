import rateLimit from 'express-rate-limit'

// Protege os endpoints de login contra força bruta: no máximo 10
// tentativas por IP a cada 15 minutos. Não afecta o resto da API.
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Demasiadas tentativas de login. Tenta novamente mais tarde.' },
})
