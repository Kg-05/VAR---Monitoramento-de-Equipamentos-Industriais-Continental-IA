import { Router } from 'express';
import {
  criarEquipamento,
  listarEquipamentos,
  detalharEquipamento,
  atualizarEquipamento,
  removerEquipamento
} from '../controllers/equipamento.controller';
import { autenticar } from '../middlewares/auth.middleware';
import { autorizar } from '../middlewares/roles.middleware';

const router = Router();

// ADMIN_CENTRAL → gerencia todos
// ADMIN_EMPRESA → gerencia apenas os seus próprios
router.post('/', autenticar, autorizar('ADMIN_CENTRAL', 'ADMIN_EMPRESA'), criarEquipamento);
router.get('/', autenticar, autorizar('ADMIN_CENTRAL', 'ADMIN_EMPRESA', 'FUNCIONARIO'), listarEquipamentos);
router.get('/:id', autenticar, autorizar('ADMIN_CENTRAL', 'ADMIN_EMPRESA', 'FUNCIONARIO'), detalharEquipamento);
router.put('/:id', autenticar, autorizar('ADMIN_CENTRAL', 'ADMIN_EMPRESA'), atualizarEquipamento);
router.delete('/:id', autenticar, autorizar('ADMIN_CENTRAL', 'ADMIN_EMPRESA'), removerEquipamento);

export default router;