import { Response } from "express";

import {
    AuthRequest
} from "../middleware/auth.middleware";

import {
    getTransactionHistory,
    getTransactionById,
    getTransactionReceipt,
    getTransactionSummary
} from "../services/transaction.service";

import {
    reverseTransaction
} from "../services/transaction.service";
import {
    exportTransactionsToCSV
} from "../services/transaction.service";

import PDFDocument from "pdfkit";


/*
 * ============================================================
 * GET TRANSACTION HISTORY
 *
 * GET /api/transactions
 * ============================================================
 */

export async function getTransactions(
    req: AuthRequest,
    res: Response
) {

    try {

        if (!req.user) {

            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });

        }

        const {
            page,
            limit,
            status,
            transactionType,
            fromDate,
            toDate,
            minAmount,
            maxAmount,
            accountId,
            search
        } = req.query;


        const pageNumber =
            page !== undefined
                ? Number(page)
                : undefined;

        const limitNumber =
            limit !== undefined
                ? Number(limit)
                : undefined;

        const minAmountNumber =
            minAmount !== undefined
                ? Number(minAmount)
                : undefined;

        const maxAmountNumber =
            maxAmount !== undefined
                ? Number(maxAmount)
                : undefined;

        const accountIdNumber =
            accountId !== undefined
                ? Number(accountId)
                : undefined;


        /*
         * Validate page
         */

        if (
            pageNumber !== undefined &&
            (
                !Number.isInteger(pageNumber) ||
                pageNumber < 1
            )
        ) {

            return res.status(400).json({
                success: false,
                message: "Invalid page number"
            });

        }


        /*
         * Validate limit
         */

        if (
            limitNumber !== undefined &&
            (
                !Number.isInteger(limitNumber) ||
                limitNumber < 1 ||
                limitNumber > 100
            )
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Limit must be between 1 and 100"
            });

        }


        /*
         * Validate account ID
         */

        if (
            accountIdNumber !== undefined &&
            (
                !Number.isInteger(accountIdNumber) ||
                accountIdNumber <= 0
            )
        ) {

            return res.status(400).json({
                success: false,
                message: "Invalid account ID"
            });

        }


        /*
         * Validate minimum amount
         */

        if (
            minAmountNumber !== undefined &&
            (
                !Number.isFinite(minAmountNumber) ||
                minAmountNumber < 0
            )
        ) {

            return res.status(400).json({
                success: false,
                message: "Invalid minimum amount"
            });

        }


        /*
         * Validate maximum amount
         */

        if (
            maxAmountNumber !== undefined &&
            (
                !Number.isFinite(maxAmountNumber) ||
                maxAmountNumber < 0
            )
        ) {

            return res.status(400).json({
                success: false,
                message: "Invalid maximum amount"
            });

        }


        /*
         * Validate amount range
         */

        if (
            minAmountNumber !== undefined &&
            maxAmountNumber !== undefined &&
            minAmountNumber > maxAmountNumber
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Minimum amount cannot be greater than maximum amount"
            });

        }


        /*
         * Get transaction history
         */

        const result =
            await getTransactionHistory({

                userId:
                    req.user.userId,

                page:
                    pageNumber,

                limit:
                    limitNumber,

                status:
                    typeof status === "string"
                        ? status
                        : undefined,

                transactionType:
                    typeof transactionType === "string"
                        ? transactionType
                        : undefined,

                fromDate:
                    typeof fromDate === "string"
                        ? fromDate
                        : undefined,

                toDate:
                    typeof toDate === "string"
                        ? toDate
                        : undefined,

                minAmount:
                    minAmountNumber,

                maxAmount:
                    maxAmountNumber,

                accountId:
                    accountIdNumber,

                search:
                    typeof search === "string"
                        ? search
                        : undefined
            });


        return res.status(200).json({

            success: true,

            data: result

        });

    } catch (error) {

        console.error(
            "Transaction history error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch transaction history"

        });

    }
}


/*
 * ============================================================
 * GET TRANSACTION DETAILS
 *
 * GET /api/transactions/:transactionId
 * ============================================================
 */

export async function getTransactionDetails(
    req: AuthRequest,
    res: Response
) {

    try {

        if (!req.user) {

            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });

        }


        const transactionId =
            Number(req.params.transactionId);


        if (
            !Number.isInteger(transactionId) ||
            transactionId <= 0
        ) {

            return res.status(400).json({
                success: false,
                message: "Invalid transaction ID"
            });

        }


        const transaction =
            await getTransactionById(
                req.user.userId,
                transactionId
            );


        return res.status(200).json({

            success: true,

            data: {
                transaction
            }

        });

    } catch (error: any) {

        console.error(
            "Transaction details error:",
            error
        );


        if (
            error.message ===
            "TRANSACTION_NOT_FOUND"
        ) {

            return res.status(404).json({
                success: false,
                message: "Transaction not found"
            });

        }


        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch transaction details"

        });

    }
}


/*
 * ============================================================
 * GET TRANSACTION RECEIPT - JSON
 *
 * GET /api/transactions/:transactionId/receipt
 * ============================================================
 */

export async function getReceipt(
    req: AuthRequest,
    res: Response
) {

    try {

        if (!req.user) {

            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });

        }


        const transactionId =
            Number(req.params.transactionId);


        if (
            !Number.isInteger(transactionId) ||
            transactionId <= 0
        ) {

            return res.status(400).json({
                success: false,
                message: "Invalid transaction ID"
            });

        }


        const receipt =
            await getTransactionReceipt(
                req.user.userId,
                transactionId
            );


        return res.status(200).json({

            success: true,

            data: {
                receipt
            }

        });

    } catch (error: any) {

        console.error(
            "Transaction receipt error:",
            error
        );


        if (
            error.message ===
            "TRANSACTION_NOT_FOUND"
        ) {

            return res.status(404).json({
                success: false,
                message: "Transaction not found"
            });

        }


        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch transaction receipt"

        });

    }
}


/*
 * ============================================================
 * GET TRANSACTION RECEIPT - PDF
 *
 * GET /api/transactions/:transactionId/receipt/pdf
 * ============================================================
 */

export async function getReceiptPdf(
    req: AuthRequest,
    res: Response
) {

    try {

        if (!req.user) {

            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });

        }


        const transactionId =
            Number(req.params.transactionId);


        if (
            !Number.isInteger(transactionId) ||
            transactionId <= 0
        ) {

            return res.status(400).json({
                success: false,
                message: "Invalid transaction ID"
            });

        }


        /*
         * Get receipt data
         */

        const transaction =
            await getTransactionReceipt(
                req.user.userId,
                transactionId
            );


        /*
         * Create PDF
         */

        const doc =
            new PDFDocument({
                size: "A4",
                margin: 50
            });


        /*
         * Response headers
         */

        res.setHeader(
            "Content-Type",
            "application/pdf"
        );

        res.setHeader(
            "Content-Disposition",
            `inline; filename="transaction-${transaction.transactionReference}.pdf"`
        );


        /*
         * Pipe PDF to response
         */

        doc.pipe(res);


        /*
         * Header
         */

        doc
            .fontSize(22)
            .text(
                "DIGITAL BANK",
                {
                    align: "center"
                }
            );


        doc
            .moveDown(0.5)
            .fontSize(16)
            .text(
                "Transaction Receipt",
                {
                    align: "center"
                }
            );


        doc.moveDown(1);


        /*
         * Divider
         */

        doc
            .moveTo(50, doc.y)
            .lineTo(545, doc.y)
            .stroke();


        doc.moveDown(1);


        /*
         * Transaction Information
         */

        doc
            .fontSize(12)
            .text(
                `Transaction Reference: ${transaction.transactionReference}`
            );

        doc
            .moveDown(0.5)
            .text(
                `Transaction Date: ${new Date(
                    transaction.transactionDate
                ).toLocaleString()}`
            );

        doc
            .moveDown(0.5)
            .text(
                `Transaction Type: ${transaction.transactionType}`
            );

        doc
            .moveDown(0.5)
            .text(
                `Status: ${transaction.status}`
            );


        doc.moveDown(1);


        /*
         * Divider
         */

        doc
            .moveTo(50, doc.y)
            .lineTo(545, doc.y)
            .stroke();


        doc.moveDown(1);


        /*
         * Account Information
         */

        doc
            .fontSize(14)
            .text(
                "Account Information"
            );

        doc.moveDown(0.5);


        doc
            .fontSize(12)
            .text(
                `Sender Account: ${transaction.senderAccount}`
            );

        doc
            .moveDown(0.5)
            .text(
                `Receiver Name: ${
                    transaction.receiverName || "N/A"
                }`
            );

        doc
            .moveDown(0.5)
            .text(
                `Receiver Account: ${transaction.receiverAccount}`
            );


        doc.moveDown(1);


        /*
         * Divider
         */

        doc
            .moveTo(50, doc.y)
            .lineTo(545, doc.y)
            .stroke();


        doc.moveDown(1);


        /*
         * Amount
         */

        doc
            .fontSize(14)
            .text(
                "Transaction Amount"
            );

        doc.moveDown(0.5);


        doc
            .fontSize(24)
            .text(
                `INR ${Number(
                    transaction.amount
                ).toFixed(2)}`,
                {
                    align: "center"
                }
            );


        doc.moveDown(1);


        /*
         * Remarks
         */

        doc
            .fontSize(12)
            .text(
                `Remarks: ${
                    transaction.remarks || "N/A"
                }`
            );


        doc.moveDown(2);


        /*
         * Footer
         */

        doc
            .fontSize(10)
            .text(
                "This is a system-generated transaction receipt.",
                {
                    align: "center"
                }
            );

        doc
            .moveDown(0.5)
            .text(
                "Digital Bank",
                {
                    align: "center"
                }
            );


        /*
         * Finalize PDF
         */

        doc.end();

    } catch (error: any) {

        console.error(
            "Transaction receipt PDF error:",
            error
        );


        if (
            error.message ===
            "TRANSACTION_NOT_FOUND"
        ) {

            return res.status(404).json({
                success: false,
                message: "Transaction not found"
            });

        }


        if (!res.headersSent) {

            return res.status(500).json({

                success: false,

                message:
                    "Failed to generate transaction receipt PDF"

            });

        }

    }
}

/*
 * ============================================================
 * GET TRANSACTION SUMMARY
 *
 * GET /api/transactions/summary
 * ============================================================
 */

export async function getSummary(
    req: AuthRequest,
    res: Response
) {

    try {

        /*
         * Check authentication
         */

        if (!req.user) {

            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });

        }


        /*
         * Get summary
         */

        const summary =
            await getTransactionSummary(
                req.user.userId
            );


        /*
         * Return response
         */

        return res.status(200).json({

            success: true,

            message:
                "Transaction summary fetched successfully",

            data: {
                summary
            }

        });

    } catch (error) {

        console.error(
            "Transaction summary error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch transaction summary"

        });

    }
}
export async function exportTransactionsCSV(
    req: AuthRequest,
    res: Response
) {

    try {

        if (!req.user) {

            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }


        const {
            status,
            transactionType,
            fromDate,
            toDate,
            minAmount,
            maxAmount,
            accountId,
            search,
            keyword,
            sortBy,
            sortOrder
        } = req.query;


        const minAmountNumber =
            minAmount !== undefined
                ? Number(minAmount)
                : undefined;


        const maxAmountNumber =
            maxAmount !== undefined
                ? Number(maxAmount)
                : undefined;


        const accountIdNumber =
            accountId !== undefined
                ? Number(accountId)
                : undefined;


        if (
            minAmountNumber !== undefined &&
            (
                !Number.isFinite(minAmountNumber) ||
                minAmountNumber < 0
            )
        ) {

            return res.status(400).json({
                success: false,
                message: "Invalid minimum amount"
            });
        }


        if (
            maxAmountNumber !== undefined &&
            (
                !Number.isFinite(maxAmountNumber) ||
                maxAmountNumber < 0
            )
        ) {

            return res.status(400).json({
                success: false,
                message: "Invalid maximum amount"
            });
        }


        const csv =
            await exportTransactionsToCSV({

                userId:
                    req.user.userId,

                status:
                    typeof status === "string"
                        ? status
                        : undefined,

                transactionType:
                    typeof transactionType === "string"
                        ? transactionType
                        : undefined,

                fromDate:
                    typeof fromDate === "string"
                        ? fromDate
                        : undefined,

                toDate:
                    typeof toDate === "string"
                        ? toDate
                        : undefined,

                minAmount:
                    minAmountNumber,

                maxAmount:
                    maxAmountNumber,

                accountId:
                    accountIdNumber,

                search:
                    typeof search === "string"
                        ? search
                        : undefined,

                keyword:
                    typeof keyword === "string"
                        ? keyword
                        : undefined,

                sortBy:
                    typeof sortBy === "string"
                        ? sortBy
                        : undefined,

                sortOrder:
                    typeof sortOrder === "string"
                        ? sortOrder
                        : undefined
            });


        res.setHeader(
            "Content-Type",
            "text/csv; charset=utf-8"
        );


        res.setHeader(
            "Content-Disposition",
            `attachment; filename="transactions.csv"`
        );


        return res.status(200).send(csv);

    } catch (error) {

        console.error(
            "Transaction CSV export error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to export transactions"

        });
    }
}

/*
 * ============================================================
 * REVERSE TRANSACTION
 *
 * POST /api/transactions/:transactionId/reverse
 * ============================================================
 */

export async function reverseTransactionController(
    req: AuthRequest,
    res: Response
) {

    try {

        /*
         * 1. Check authentication
         */

        if (!req.user) {

            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }


        /*
         * 2. Get transaction ID
         */

        const transactionId =
            Number(req.params.transactionId);


        /*
         * 3. Validate transaction ID
         */

        if (
            !Number.isInteger(transactionId) ||
            transactionId <= 0
        ) {

            return res.status(400).json({
                success: false,
                message: "Invalid transaction ID"
            });
        }


        /*
         * 4. Reverse transaction
         */

        const result =
            await reverseTransaction(
                req.user.userId,
                transactionId
            );


        /*
         * 5. Successful response
         */

        return res.status(200).json({

            success: true,

            message:
                "Transaction reversed successfully",

            data: {
                reversal: result
            }

        });

    } catch (error: any) {

        console.error(
            "Transaction reversal error:",
            error
        );


        /*
         * 6. Handle business errors
         */

        switch (error.message) {

            case "TRANSACTION_NOT_FOUND":

                return res.status(404).json({
                    success: false,
                    message:
                        "Transaction not found"
                });


            case "TRANSACTION_NOT_REVERSIBLE":

                return res.status(400).json({
                    success: false,
                    message:
                        "Only successful transactions can be reversed"
                });


            case "RECEIVER_ACCOUNT_NOT_FOUND":

                return res.status(404).json({
                    success: false,
                    message:
                        "Receiver account not found"
                });


            case "RECEIVER_ACCOUNT_INACTIVE":

                return res.status(400).json({
                    success: false,
                    message:
                        "Receiver account is inactive"
                });


            case "RECEIVER_INSUFFICIENT_BALANCE":

                return res.status(400).json({
                    success: false,
                    message:
                        "Receiver has insufficient balance for reversal"
                });


            case "SENDER_ACCOUNT_NOT_FOUND":

                return res.status(404).json({
                    success: false,
                    message:
                        "Sender account not found"
                });


            default:

                return res.status(500).json({
                    success: false,
                    message:
                        "Failed to reverse transaction"
                });
        }
    }
}