import { Router } from "express";
import { healthcheck } from "../controllers/healthcheck.controller.js";

import { verifyToken } from "../middlewares/auth.middleware.js";

const router =Router();

router.get("/get-health",verifyToken,healthcheck);

export default router;