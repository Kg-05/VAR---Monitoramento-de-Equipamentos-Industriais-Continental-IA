import { Router } from "express";
import { login, registrar } from "../controllers/auth.controller";
import { autenticar } from "../middlewares/auth.middleware";
import { autorizar } from "../middlewares/roles.middleware";

const router = Router();

router.post("/login", login);

// Só ADMIN_CENTRAL e ADMIN_EMPRESA podem registrar
router.post(
  "/registrar",
  autenticar,
  autorizar("ADMIN_CENTRAL", "ADMIN_EMPRESA"),
  registrar
);

export default router;