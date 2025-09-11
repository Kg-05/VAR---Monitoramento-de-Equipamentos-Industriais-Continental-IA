import { Router } from 'express';
import {
  criarDispositivo,
  listarDispositivos,
  atualizarDispositivo,
  removerDispositivo
} from '../controllers/dispositivo.controller';
import { autenticar } from '../middlewares/auth.middleware';
import { autorizar } from '../middlewares/roles.middleware';

const router = Router();

// ADMIN_CENTRAL e ADMIN_EMPRESA -> criar
router.post('/', autenticar, autorizar('ADMIN_CENTRAL', 'ADMIN_EMPRESA'), criarDispositivo);

// ADMIN_CENTRAL -> lista tudo, ADMIN_EMPRESA/FUNCIONARIO -> lista só os da sua empresa
router.get('/', autenticar, autorizar('ADMIN_CENTRAL', 'ADMIN_EMPRESA', 'FUNCIONARIO'), listarDispositivos);

// Atualizar e remover -> ADMIN_CENTRAL e ADMIN_EMPRESA
router.put('/:id', autenticar, autorizar('ADMIN_CENTRAL', 'ADMIN_EMPRESA'), atualizarDispositivo);
router.delete('/:id', autenticar, autorizar('ADMIN_CENTRAL', 'ADMIN_EMPRESA'), removerDispositivo);

export default router;