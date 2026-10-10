import { db } from "../config/database";


/*
 * ============================================================
 * GET ALL ACCOUNTS FOR USER
 * ============================================================
 */

export async function getAccountsByUserId(
    userId: number
) {

    const [rows] = await db.query(
        `
        SELECT
            id,
            account_number,
            account_type,
            balance,
            currency,
            status,
            created_at

        FROM accounts

        WHERE user_id = ?

        ORDER BY created_at DESC
        `,
        [userId]
    );

    return rows;
}


/*
 * ============================================================
 * ACCOUNT STATEMENT OPTIONS
 * ============================================================
 */

interface AccountStatementOptions {

    userId: number;

    accountId: number;

    page?: number;

    limit?: number;

    fromDate?: string;

    toDate?: string;
}


/*
 * ============================================================
 * GET ACCOUNT STATEMENT
 * ============================================================
 */

export async function getAccountStatement(
    options: AccountStatementOptions
) {

    const {
        userId,
        accountId,
        page = 1,
        limit = 10,
        fromDate,
        toDate
    } = options;


    /*
     * ========================================================
     * 1. Pagination
     * ========================================================
     */

    const safePage =
        Math.max(
            1,
            Number(page)
        );


    const safeLimit =
        Math.min(
            100,
            Math.max(
                1,
                Number(limit)
            )
        );


    const offset =
        (safePage - 1) *
        safeLimit;


    /*
     * ========================================================
     * 2. Verify account belongs to user
     * ========================================================
     */

    const [accountRows] =
        await db.query(
            `
            SELECT
                id,
                account_number,
                account_type,
                balance,
                currency,
                status,
                created_at

            FROM accounts

            WHERE id = ?

              AND user_id = ?

            LIMIT 1
            `,
            [
                accountId,
                userId
            ]
        );


    const accounts =
        accountRows as any[];


    if (
        accounts.length === 0
    ) {

        throw new Error(
            "ACCOUNT_NOT_FOUND"
        );
    }


    const account =
        accounts[0];


    /*
     * ========================================================
     * 3. Build transaction conditions
     *
     * DEBIT:
     * sender_account_id = account.id
     *
     * CREDIT:
     * receiver_account_number = account.account_number
     * ========================================================
     */

    const conditions: string[] = [

        `
        (
            t.sender_account_id = ?
            OR
            t.receiver_account_number = ?
        )
        `

    ];


    const parameters: any[] = [

        accountId,

        account.account_number

    ];


    /*
     * ========================================================
     * 4. Date filtering
     * ========================================================
     */

    if (fromDate) {

        conditions.push(
            "t.created_at >= ?"
        );

        parameters.push(
            `${fromDate} 00:00:00`
        );
    }


    if (toDate) {

        conditions.push(
            "t.created_at <= ?"
        );

        parameters.push(
            `${toDate} 23:59:59`
        );
    }


    const whereClause =
        conditions.join(
            " AND "
        );


    /*
     * ========================================================
     * 5. Transaction count
     * ========================================================
     */

    const [countRows] =
        await db.query(
            `
            SELECT
                COUNT(*) AS total

            FROM transactions t

            WHERE ${whereClause}
            `,
            parameters
        );


    const totalRecords =
        Number(
            (countRows as any[])[0]
                .total
        );


    /*
     * ========================================================
     * 6. Total debits
     * ========================================================
     */

    const [debitRows] =
        await db.query(
            `
            SELECT

                COALESCE(
                    SUM(t.amount),
                    0
                ) AS total_debits

            FROM transactions t

            WHERE
                t.sender_account_id = ?

            AND t.status = 'SUCCESS'

            ${fromDate
                ? "AND t.created_at >= ?"
                : ""}

            ${toDate
                ? "AND t.created_at <= ?"
                : ""}
            `,
            [
                accountId,

                ...(fromDate
                    ? [`${fromDate} 00:00:00`]
                    : []),

                ...(toDate
                    ? [`${toDate} 23:59:59`]
                    : [])
            ]
        );


    const totalDebits =
        Number(
            (debitRows as any[])[0]
                .total_debits
        );


    /*
     * ========================================================
     * 7. Total credits
     * ========================================================
     */

    const [creditRows] =
        await db.query(
            `
            SELECT

                COALESCE(
                    SUM(t.amount),
                    0
                ) AS total_credits

            FROM transactions t

            WHERE
                t.receiver_account_number = ?

            AND t.status = 'SUCCESS'

            ${fromDate
                ? "AND t.created_at >= ?"
                : ""}

            ${toDate
                ? "AND t.created_at <= ?"
                : ""}
            `,
            [
                account.account_number,

                ...(fromDate
                    ? [`${fromDate} 00:00:00`]
                    : []),

                ...(toDate
                    ? [`${toDate} 23:59:59`]
                    : [])
            ]
        );


    const totalCredits =
        Number(
            (creditRows as any[])[0]
                .total_credits
        );


    /*
     * ========================================================
     * 8. Get transactions
     * ========================================================
     */

    const [transactionRows] =
        await db.query(
            `
            SELECT

                t.id,

                t.transaction_reference,

                t.sender_account_id,

                t.receiver_account_number,

                t.amount,

                t.transaction_type,

                t.status,

                t.remarks,

                t.created_at,

                t.updated_at,

                CASE

                    WHEN t.sender_account_id = ?
                    THEN 'DEBIT'

                    WHEN t.receiver_account_number = ?
                    THEN 'CREDIT'

                END AS transaction_direction

            FROM transactions t

            WHERE ${whereClause}

            ORDER BY
                t.created_at DESC,
                t.id DESC

            LIMIT ?

            OFFSET ?
            `,
            [
                accountId,

                account.account_number,

                ...parameters,

                safeLimit,

                offset
            ]
        );


    /*
     * ========================================================
     * 9. Pagination
     * ========================================================
     */

    const totalPages =
        Math.ceil(
            totalRecords /
            safeLimit
        );


    /*
     * ========================================================
     * 10. Return statement
     * ========================================================
     */

    return {

        account: {

            accountId:
                account.id,

            accountNumber:
                account.account_number,

            accountType:
                account.account_type,

            currency:
                account.currency,

            status:
                account.status,

            currentBalance:
                Number(
                    account.balance
                )
        },


        summary: {

            totalDebits,

            totalCredits,

            transactionCount:
                totalRecords
        },


        transactions:
            transactionRows,


        pagination: {

            page:
                safePage,

            limit:
                safeLimit,

            totalRecords,

            totalPages,

            hasNextPage:
                safePage < totalPages,

            hasPreviousPage:
                safePage > 1
        }
    };
}

/*
 * ============================================================
 * GET ACCOUNT DETAILS
 *
 * Returns one account belonging to the logged-in user.
 * ============================================================
 */

export async function getAccountById(
    userId: number,
    accountId: number
) {

    const [rows] = await db.query(
        `
        SELECT
            id,
            account_number,
            account_type,
            balance,
            currency,
            status,
            created_at,
            updated_at

        FROM accounts

        WHERE id = ?
          AND user_id = ?

        LIMIT 1
        `,
        [
            accountId,
            userId
        ]
    );


    const accounts =
        rows as any[];


    /*
     * Account doesn't exist
     * or doesn't belong to this user
     */

    if (accounts.length === 0) {

        throw new Error(
            "ACCOUNT_NOT_FOUND"
        );
    }


    const account =
        accounts[0];


    return {

        id:
            account.id,

        accountNumber:
            account.account_number,

        accountType:
            account.account_type,

        balance:
            Number(account.balance),

        currency:
            account.currency,

        status:
            account.status,

        createdAt:
            account.created_at,

        updatedAt:
            account.updated_at

    };
}

/*
 * ============================================================
 * GET ACCOUNT BALANCE
 *
 * Returns balance and status for the logged-in user's account.
 * ============================================================
 */

export async function getAccountBalance(
    userId: number,
    accountId: number
) {

    const [rows] = await db.query(
        `
        SELECT
            id,
            account_number,
            balance,
            currency,
            status

        FROM accounts

        WHERE id = ?
          AND user_id = ?

        LIMIT 1
        `,
        [
            accountId,
            userId
        ]
    );


    const accounts =
        rows as any[];


    /*
     * Account doesn't exist
     * or doesn't belong to this user.
     */

    if (accounts.length === 0) {

        throw new Error(
            "ACCOUNT_NOT_FOUND"
        );
    }


    const account =
        accounts[0];


    return {

        accountId:
            account.id,

        accountNumber:
            account.account_number,

        balance:
            Number(account.balance),

        currency:
            account.currency,

        status:
            account.status

    };
}

/*
 * ============================================================
 * GET ACCOUNT STATUS
 *
 * Returns the current status of the logged-in user's account.
 * ============================================================
 */

export async function getAccountStatus(
    userId: number,
    accountId: number
) {

    const [rows] = await db.query(
        `
        SELECT
            id,
            account_number,
            status

        FROM accounts

        WHERE id = ?
          AND user_id = ?

        LIMIT 1
        `,
        [
            accountId,
            userId
        ]
    );


    const accounts =
        rows as any[];


    /*
     * Account doesn't exist
     * or doesn't belong to this user.
     */

    if (accounts.length === 0) {

        throw new Error(
            "ACCOUNT_NOT_FOUND"
        );
    }


    const account =
        accounts[0];


    return {

        accountId:
            account.id,

        accountNumber:
            account.account_number,

        status:
            account.status

    };
}