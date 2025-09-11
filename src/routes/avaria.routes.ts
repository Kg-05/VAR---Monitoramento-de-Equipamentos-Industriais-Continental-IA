import { Router } from 'express';
import {
  criarAvaria,
  listarAvarias,
  resolverAvaria
} from '../controllers/avaria.controller';
import { autenticar } from '../middlewares/auth.middleware';
import { autorizar } from '../middlewares/roles.middleware';

const router = Router();

// Criar: ADMIN_CENTRAL (teste), ADMIN_EMPRESA e FUNCIONARIO (da sua empresa)
router.post('/', autenticar, autorizar('ADMIN_CENTRAL', 'ADMIN_EMPRESA', 'FUNCIONARIO'), criarAvaria);

// Listar: todos os papéis, mas com filtro de empresa
router.get('/', autenticar, autorizar('ADMIN_CENTRAL', 'ADMIN_EMPRESA', 'FUNCIONARIO'), listarAvarias);

// Resolver: ADMIN_EMPRESA e FUNCIONARIO (dentro da sua empresa)
router.post('/:id/resolver', autenticar, autorizar('ADMIN_EMPRESA', 'FUNCIONARIO'), resolverAvaria);

export default router;