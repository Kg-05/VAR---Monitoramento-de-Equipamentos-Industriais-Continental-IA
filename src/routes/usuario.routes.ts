import { Router } from 'express';
import {
  criarUsuario,
  listarUsuarios,
  detalharUsuario,
  atualizarUsuario,
  removerUsuario,
  registroPublico
} from '../controllers/usuario.controller';
import { autenticar } from '../middlewares/auth.middleware';
import { autorizar } from '../middlewares/roles.middleware';

const router = Router();

// Rota pública de cadastro (signup)
router.post('/public/registro', registroPublico);

// ADMIN_CENTRAL e ADMIN_EMPRESA podem criar (mas cada um com suas restrições no controller)
router.post('/', autenticar, autorizar('ADMIN_CENTRAL', 'ADMIN_EMPRESA'), criarUsuario);

// ADMIN_CENTRAL vê todos, ADMIN_EMPRESA só os da própria empresa, FUNCIONARIO pode visualizar
router.get('/', autenticar, autorizar('ADMIN_CENTRAL', 'ADMIN_EMPRESA', 'FUNCIONARIO'), listarUsuarios);

// ADMIN_CENTRAL vê qualquer um, ADMIN_EMPRESA só da própria empresa, FUNCIONARIO pode visualizar
router.get('/:id', autenticar, autorizar('ADMIN_CENTRAL', 'ADMIN_EMPRESA', 'FUNCIONARIO'), detalharUsuario);

// Atualização com a mesma lógica
router.put('/:id', autenticar, autorizar('ADMIN_CENTRAL', 'ADMIN_EMPRESA'), atualizarUsuario);

// Remoção idem
router.delete('/:id', autenticar, autorizar('ADMIN_CENTRAL', 'ADMIN_EMPRESA'), removerUsuario);

export default router;