import { Router } from "express";

import {
    createTransactionPin,
    verifyPin,
    changePin
} from "../controllers/transactionPin.controller";

import {
    authenticateToken
} from "../middleware/auth.middleware";


const router = Router();


/*
 * ============================================================
 * Create Transaction PIN
 *
 * POST /api/security/transaction-pin
 * ============================================================
 */

router.post(
    "/transaction-pin",
    authenticateToken,
    createTransactionPin
);


/*
 * ============================================================
 * Verify Transaction PIN
 *
 * POST /api/security/transaction-pin/verify
 * ============================================================
 */

router.post(
    "/transaction-pin/verify",
    authenticateToken,
    verifyPin
);

/*
 * ============================================================
 * Change Transaction PIN
 *
 * PUT /api/security/transaction-pin
 * ============================================================
 */

router.put(
    "/transaction-pin",
    authenticateToken,
    changePin
);

export default router;