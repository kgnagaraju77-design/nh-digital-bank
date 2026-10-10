import { Router } from "express";

import {
    authenticateToken
} from "../middleware/auth.middleware";

import {
    confirmTransferController
} from "../controllers/transferConfirmation.controller";


const router = Router();


/*
 * Confirm fund transfer
 *
 * POST /api/transfers/confirm
 */

router.post(
    "/confirm",
    authenticateToken,
    confirmTransferController
);


export default router;