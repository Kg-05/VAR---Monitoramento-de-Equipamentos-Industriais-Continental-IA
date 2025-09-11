import { Router } from 'express';
import {
  criarAlerta,
  listarAlertas,
  reconhecerAlerta
} from '../controllers/alerta.controller';
import { autenticar } from '../middlewares/auth.middleware';
import { autorizar } from '../middlewares/roles.middleware';

const router = Router();

// Criar: ADMIN_CENTRAL e ADMIN_EMPRESA
router.post('/', autenticar, autorizar('ADMIN_CENTRAL', 'ADMIN_EMPRESA'), criarAlerta);

// Listar: todos, mas restrito à empresa no caso de EMPRESA/FUNCIONARIO
router.get('/', autenticar, autorizar('ADMIN_CENTRAL', 'ADMIN_EMPRESA', 'FUNCIONARIO'), listarAlertas);

// Reconhecer: ADMIN_EMPRESA e FUNCIONARIO
router.post('/:id/reconhecer', autenticar, autorizar('ADMIN_EMPRESA', 'FUNCIONARIO'), reconhecerAlerta);

export default router;