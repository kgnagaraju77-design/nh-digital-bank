import { Response } from "express";

import {
    AuthRequest
} from "../middleware/auth.middleware";

import {
    getAccountsByUserId,
    getAccountStatement,
     getAccountById,
     getAccountBalance,
     getAccountStatus
} from "../services/account.service";


/*
 * ============================================================
 * GET USER ACCOUNTS
 * ============================================================
 */

export async function getAccounts(
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

        const accounts =
            await getAccountsByUserId(
                req.user.userId
            );

        return res.status(200).json({

            success: true,

            data: {
                accounts
            }

        });

    } catch (error) {

        console.error(
            "Get accounts error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch accounts"

        });
    }
}


/*
 * ============================================================
 * GET ACCOUNT STATEMENT
 * ============================================================
 *
 * GET
 * /api/accounts/:accountId/statement
 *
 * Example:
 *
 * /api/accounts/1/statement
 *
 * /api/accounts/1/statement?page=1&limit=10
 *
 * /api/accounts/1/statement?fromDate=2026-01-01&toDate=2026-09-15
 *
 * ============================================================
 */

export async function getStatement(
    req: AuthRequest,
    res: Response
) {

    try {

        /*
         * 1. Authentication
         */

        if (!req.user) {

            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }


        /*
         * 2. Account ID
         */

        const accountId =
            Number(
                req.params.accountId
            );


        /*
         * 3. Validate account ID
         */

        if (
            !Number.isInteger(accountId) ||
            accountId <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid account ID"

            });
        }


        /*
         * 4. Query parameters
         */

        const {
            page,
            limit,
            fromDate,
            toDate
        } = req.query;


        /*
         * 5. Convert pagination
         */

        const pageNumber =
            page !== undefined
                ? Number(page)
                : undefined;


        const limitNumber =
            limit !== undefined
                ? Number(limit)
                : undefined;


        /*
         * 6. Validate page
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

                message:
                    "Invalid page number"

            });
        }


        /*
         * 7. Validate limit
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
         * 8. Validate date format
         */

        const dateRegex =
            /^\d{4}-\d{2}-\d{2}$/;


        if (
            fromDate !== undefined &&
            (
                typeof fromDate !== "string" ||
                !dateRegex.test(fromDate)
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid fromDate. Use YYYY-MM-DD"

            });
        }


        if (
            toDate !== undefined &&
            (
                typeof toDate !== "string" ||
                !dateRegex.test(toDate)
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid toDate. Use YYYY-MM-DD"

            });
        }


        /*
         * 9. Validate date range
         */

        if (
            typeof fromDate === "string" &&
            typeof toDate === "string" &&
            fromDate > toDate
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "fromDate cannot be greater than toDate"

            });
        }


        /*
         * 10. Get statement
         */

        const statement =
            await getAccountStatement({

                userId:
                    req.user.userId,

                accountId,

                page:
                    pageNumber,

                limit:
                    limitNumber,

                fromDate:
                    typeof fromDate === "string"
                        ? fromDate
                        : undefined,

                toDate:
                    typeof toDate === "string"
                        ? toDate
                        : undefined

            });


        /*
         * 11. Success response
         */

        return res.status(200).json({

            success: true,

            message:
                "Account statement fetched successfully",

            data: statement

        });

    } catch (error: any) {

        console.error(
            "Account statement error:",
            error
        );


        /*
         * Account doesn't belong
         * to logged-in user
         */

        if (
            error.message ===
            "ACCOUNT_NOT_FOUND"
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "Account not found"

            });
        }


        /*
         * Unexpected error
         */

        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch account statement"

        });
    }
}

/*
 * ============================================================
 * GET ACCOUNT DETAILS
 *
 * GET /api/accounts/:accountId
 * ============================================================
 */

export async function getAccountDetails(
    req: AuthRequest,
    res: Response
) {

    try {

        /*
         * 1. Authentication
         */

        if (!req.user) {

            return res.status(401).json({

                success: false,

                message:
                    "Unauthorized"

            });
        }


        /*
         * 2. Get account ID
         */

        const accountId =
            Number(
                req.params.accountId
            );


        /*
         * 3. Validate account ID
         */

        if (
            !Number.isInteger(accountId) ||
            accountId <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid account ID"

            });
        }


        /*
         * 4. Get account
         */

        const account =
            await getAccountById(

                req.user.userId,

                accountId

            );


        /*
         * 5. Success response
         */

        return res.status(200).json({

            success: true,

            message:
                "Account details retrieved successfully",

            data: {

                account

            }

        });

    } catch (error: any) {

        console.error(
            "Get account details error:",
            error
        );


        /*
         * Account not found
         */

        if (
            error.message ===
            "ACCOUNT_NOT_FOUND"
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "Account not found"

            });
        }


        /*
         * Unexpected error
         */

        return res.status(500).json({

            success: false,

            message:
                "Failed to retrieve account details"

        });
    }
}

/*
 * ============================================================
 * GET ACCOUNT BALANCE
 *
 * GET /api/accounts/:accountId/balance
 * ============================================================
 */

export async function getBalance(
    req: AuthRequest,
    res: Response
) {

    try {

        /*
         * 1. Authentication
         */

        if (!req.user) {

            return res.status(401).json({

                success: false,

                message:
                    "Unauthorized"

            });
        }


        /*
         * 2. Get account ID
         */

        const accountId =
            Number(
                req.params.accountId
            );


        /*
         * 3. Validate account ID
         */

        if (
            !Number.isInteger(accountId) ||
            accountId <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid account ID"

            });
        }


        /*
         * 4. Get balance
         */

        const balance =
            await getAccountBalance(

                req.user.userId,

                accountId

            );


        /*
         * 5. Success response
         */

        return res.status(200).json({

            success: true,

            message:
                "Account balance retrieved successfully",

            data:
                balance

        });

    } catch (error: any) {

        console.error(
            "Get account balance error:",
            error
        );


        /*
         * Account not found
         */

        if (
            error.message ===
            "ACCOUNT_NOT_FOUND"
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "Account not found"

            });
        }


        /*
         * Unexpected error
         */

        return res.status(500).json({

            success: false,

            message:
                "Failed to retrieve account balance"

        });
    }
}

/*
 * ============================================================
 * GET ACCOUNT STATUS
 *
 * GET /api/accounts/:accountId/status
 * ============================================================
 */

export async function getStatus(
    req: AuthRequest,
    res: Response
) {

    try {

        /*
         * 1. Authentication
         */

        if (!req.user) {

            return res.status(401).json({

                success: false,

                message:
                    "Unauthorized"

            });
        }


        /*
         * 2. Get account ID
         */

        const accountId =
            Number(
                req.params.accountId
            );


        /*
         * 3. Validate account ID
         */

        if (
            !Number.isInteger(accountId) ||
            accountId <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid account ID"

            });
        }


        /*
         * 4. Get account status
         */

        const account =
            await getAccountStatus(

                req.user.userId,

                accountId

            );


        /*
         * 5. Success response
         */

        return res.status(200).json({

            success: true,

            message:
                "Account status retrieved successfully",

            data: account

        });

    } catch (error: any) {

        console.error(
            "Get account status error:",
            error
        );


        /*
         * Account not found
         */

        if (
            error.message ===
            "ACCOUNT_NOT_FOUND"
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "Account not found"

            });
        }


        /*
         * Unexpected error
         */

        return res.status(500).json({

            success: false,

            message:
                "Failed to retrieve account status"

        });
    }
}