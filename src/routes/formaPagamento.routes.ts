import { Router } from 'express';
import { listarFormasPagamento, criarFormaPagamento } from '../controllers/formaPagamento.controller';
import { autenticar } from '../middlewares/auth.middleware';
import { autorizar } from '../middlewares/roles.middleware';

const router = Router();

router.get('/', autenticar, autorizar('FUNCIONARIO','ADMIN_EMPRESA','ADMIN_CENTRAL'), listarFormasPagamento);
router.post('/', autenticar, autorizar('ADMIN_CENTRAL'), criarFormaPagamento);

export default router;
