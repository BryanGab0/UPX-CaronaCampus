import { rateLimit } from "express-rate-limit";

// Limites por IP nas rotas de autenticação, contra tentativa e erro de senhas
// (força bruta) e criação de contas em massa. A contagem fica em memória.

const MINUTO = 60 * 1000;

// Login: só as tentativas que FALHAM contam (quem acerta a senha não é afetado).
export const limiteLogin = rateLimit({
  windowMs: 15 * MINUTO,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { erro: "Muitas tentativas de login. Aguarde alguns minutos e tente novamente." },
});

// Cadastro: todas as tentativas contam.
export const limiteRegistro = rateLimit({
  windowMs: 60 * MINUTO,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { erro: "Muitos cadastros a partir desta rede. Tente novamente mais tarde." },
});
