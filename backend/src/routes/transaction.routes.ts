import { Router } from "express";

import {
    getTransactions,
    getTransactionDetails,
    getReceipt,
    getReceiptPdf,
    getSummary,
    exportTransactionsCSV,
    reverseTransactionController
} from "../controllers/transaction.controller";

import {
    authenticateToken
} from "../middleware/auth.middleware";


const router = Router();


/*
 * ============================================================
 * Transaction History
 *
 * GET /api/transactions
 * ============================================================
 */

router.get(
    "/",
    authenticateToken,
    getTransactions
);


/*
 * ============================================================
 * Transaction Summary
 *
 * GET /api/transactions/summary
 * ============================================================
 */

router.get(
    "/summary",
    authenticateToken,
    getSummary
);


/*
 * ============================================================
 * Transaction CSV Export
 *
 * GET /api/transactions/export/csv
 * ============================================================
 */

router.get(
    "/export/csv",
    authenticateToken,
    exportTransactionsCSV
);


/*
 * ============================================================
 * Transaction Receipt - JSON
 *
 * GET /api/transactions/:transactionId/receipt
 * ============================================================
 */

router.get(
    "/:transactionId/receipt",
    authenticateToken,
    getReceipt
);


/*
 * ============================================================
 * Transaction Receipt - PDF
 *
 * GET /api/transactions/:transactionId/receipt/pdf
 * ============================================================
 */

router.get(
    "/:transactionId/receipt/pdf",
    authenticateToken,
    getReceiptPdf
);


/*
 * ============================================================
 * Transaction Reversal
 *
 * POST /api/transactions/:transactionId/reverse
 * ============================================================
 */

router.post(
    "/:transactionId/reverse",
    authenticateToken,
    reverseTransactionController
);


/*
 * ============================================================
 * Transaction Details
 *
 * GET /api/transactions/:transactionId
 * ============================================================
 */

router.get(
    "/:transactionId",
    authenticateToken,
    getTransactionDetails
);


export default router;