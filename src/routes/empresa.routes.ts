import { Router } from 'express';
import {
  criarEmpresa,
  listarEmpresas,
  detalharEmpresa,
  atualizarEmpresa,
  removerEmpresa
} from '../controllers/empresa.controller';
import { autenticar } from '../middlewares/auth.middleware';
import { autorizar } from '../middlewares/roles.middleware';

const router = Router();

// Apenas ADMIN_CENTRAL pode manipular empresas
router.post('/', autenticar, autorizar('ADMIN_CENTRAL'), criarEmpresa);
router.get('/', autenticar, autorizar('ADMIN_CENTRAL', 'ADMIN_EMPRESA'), listarEmpresas);
router.get('/:id', autenticar, autorizar('ADMIN_CENTRAL'), detalharEmpresa);
router.put('/:id', autenticar, autorizar('ADMIN_CENTRAL'), atualizarEmpresa);
router.delete('/:id', autenticar, autorizar('ADMIN_CENTRAL'), removerEmpresa);

export default router;