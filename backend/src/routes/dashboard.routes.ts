import { Router } from "express";

import { getDashboard } from "../controllers/dashboard.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

router.get(
    "/",
    authenticateToken,
    getDashboard
);

export default router;