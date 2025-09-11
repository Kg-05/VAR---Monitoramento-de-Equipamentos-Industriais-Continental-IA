import { Router } from 'express';
import {
  criarUsuario,
  listarUsuarios,
  detalharUsuario,
  atualizarUsuario,
  removerUsuario
} from '../controllers/usuario.controller';
import { autenticar } from '../middlewares/auth.middleware';
import { autorizar } from '../middlewares/roles.middleware';

const router = Router();

// ADMIN_CENTRAL e ADMIN_EMPRESA podem criar (mas cada um com suas restrições no controller)
router.post('/', autenticar, autorizar('ADMIN_CENTRAL', 'ADMIN_EMPRESA'), criarUsuario);

// ADMIN_CENTRAL vê todos, ADMIN_EMPRESA só os da própria empresa
router.get('/', autenticar, autorizar('ADMIN_CENTRAL', 'ADMIN_EMPRESA'), listarUsuarios);

// ADMIN_CENTRAL vê qualquer um, ADMIN_EMPRESA só da própria empresa
router.get('/:id', autenticar, autorizar('ADMIN_CENTRAL', 'ADMIN_EMPRESA'), detalharUsuario);

// Atualização com a mesma lógica
router.put('/:id', autenticar, autorizar('ADMIN_CENTRAL', 'ADMIN_EMPRESA'), atualizarUsuario);

// Remoção idem
router.delete('/:id', autenticar, autorizar('ADMIN_CENTRAL', 'ADMIN_EMPRESA'), removerUsuario);

export default router;