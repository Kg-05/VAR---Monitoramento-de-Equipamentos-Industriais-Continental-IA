import rateLimit from 'express-rate-limit'

// Protege os endpoints de login contra força bruta: no máximo 5
// tentativas por IP a cada 15 minutos. Não afecta o resto da API.
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Demasiadas tentativas de login. Tenta novamente mais tarde.' },
})

// Limite global para toda a API — protege contra abuso/DoS aplicativo
// (scraping, força bruta noutras rotas, etc). Generoso o suficiente para
// uso normal do dashboard e do app mobile, que fazem várias chamadas em
// paralelo ao carregar cada ecrã.
export const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Demasiados pedidos. Tenta novamente mais tarde.' },
})
