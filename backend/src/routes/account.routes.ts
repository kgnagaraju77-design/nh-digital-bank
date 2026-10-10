import { Router } from "express";

import {
    getAccounts,
    getStatement,
    getAccountDetails,
    getBalance,
    getStatus
} from "../controllers/account.controller";

import {
    authenticateToken
} from "../middleware/auth.middleware";


const router = Router();


/*
 * Get all accounts
 *
 * GET /api/accounts
 */
router.get(
    "/",
    authenticateToken,
    getAccounts
);


/*
 * Get account statement
 *
 * GET /api/accounts/:accountId/statement
 */
router.get(
    "/:accountId/statement",
    authenticateToken,
    getStatement
);

/*
 * ============================================================
 * GET ACCOUNT STATUS
 *
 * GET /api/accounts/:accountId/status
 * ============================================================
 */

router.get(
    "/:accountId/status",
    authenticateToken,
    getStatus
);
/*
 * Get account details
 *
 * GET /api/accounts/:accountId
 */

router.get(
    "/:accountId",
    authenticateToken,
    getAccountDetails
);

/*
 * ============================================================
 * GET ACCOUNT BALANCE
 *
 * GET /api/accounts/:accountId/balance
 * ============================================================
 */

router.get(
    "/:accountId/balance",
    authenticateToken,
    getBalance
);
export default router;