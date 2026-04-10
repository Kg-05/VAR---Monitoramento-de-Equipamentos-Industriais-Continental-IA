import { Router } from 'express';
import { criarRegistroImagem, listarRegistroImagens } from '../controllers/registroImagem.controller';
import { autenticar } from '../middlewares/auth.middleware';
import { autorizar } from '../middlewares/roles.middleware';

const router = Router();

// criação e listagem de registros de imagens
router.post('/', autenticar, autorizar('FUNCIONARIO','ADMIN_EMPRESA','ADMIN_CENTRAL'), criarRegistroImagem);
router.get('/', autenticar, autorizar('FUNCIONARIO','ADMIN_EMPRESA','ADMIN_CENTRAL'), listarRegistroImagens);

export default router;
