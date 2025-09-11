import jwt from 'jsonwebtoken';
const SECRET = process.env.JWT_SECRET || 'kituxi_group25';

export const gerarToken = (payload: object) => {
  return jwt.sign(payload, SECRET, { expiresIn: '12h' });
};

export const verificarToken = (token: string) => {
  return jwt.verify(token, SECRET);
};