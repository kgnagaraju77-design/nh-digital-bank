import { Router } from "express";

import {
    createTransfer
} from "../controllers/transfer.controller";

import {
    authenticateToken
} from "../middleware/auth.middleware";

const router = Router();

router.post(
    "/",
    authenticateToken,
    createTransfer
);

export default router;