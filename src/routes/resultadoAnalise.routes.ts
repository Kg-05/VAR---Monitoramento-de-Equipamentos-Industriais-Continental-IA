import { Router } from 'express';
import { criarResultadoAnalise, listarAnalises } from '../controllers/resultadoAnalise.controller';
import { autenticar } from '../middlewares/auth.middleware';
import { autorizar } from '../middlewares/roles.middleware';

const router = Router();

router.post('/', autenticar, autorizar('FUNCIONARIO','ADMIN_EMPRESA','ADMIN_CENTRAL'), criarResultadoAnalise);
router.get('/', autenticar, autorizar('FUNCIONARIO','ADMIN_EMPRESA','ADMIN_CENTRAL'), listarAnalises);

export default router;
