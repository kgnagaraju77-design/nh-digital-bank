import { db } from "../config/database";

import {
    createNotification
} from "./notification.service";


interface TransactionHistoryOptions {
    userId: number;

    page?: number;
    limit?: number;

    status?: string;
    transactionType?: string;

    fromDate?: string;
    toDate?: string;

    minAmount?: number;
    maxAmount?: number;

    accountId?: number;

    search?: string;
    keyword?: string;

    sortBy?: string;
    sortOrder?: string;
}


/*
 * ============================================================
 * GET TRANSACTION HISTORY
 * ============================================================
 */

export async function getTransactionHistory(
    options: TransactionHistoryOptions
) {

    const {
        userId,
        page = 1,
        limit = 10,
        status,
        transactionType,
        fromDate,
        toDate,
        minAmount,
        maxAmount,
        accountId,
        search,
        keyword,
        sortBy = "date",
        sortOrder = "DESC"
    } = options;


    /*
     * ========================================================
     * PAGINATION
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
        (safePage - 1) * safeLimit;


    /*
     * ========================================================
     * SAFE SORTING
     *
     * Never directly put user input into SQL ORDER BY.
     * ========================================================
     */

    const allowedSortColumns: Record<string, string> = {

        date:
            "t.created_at",

        amount:
            "t.amount",

        id:
            "t.id",

        status:
            "t.status",

        reference:
            "t.transaction_reference"

    };


    const safeSortBy =
        allowedSortColumns[sortBy] ||
        "t.created_at";


    const safeSortOrder =
        String(sortOrder)
            .toUpperCase() === "ASC"
            ? "ASC"
            : "DESC";


    /*
     * ========================================================
     * BASE CONDITION
     *
     * IMPORTANT:
     * Only transactions belonging to the
     * logged-in user's account are returned.
     * ========================================================
     */

    const conditions: string[] = [

        "a.user_id = ?"

    ];


    const parameters: any[] = [

        userId

    ];


    /*
     * ========================================================
     * ACCOUNT FILTER
     * ========================================================
     */

    if (
        accountId !== undefined &&
        accountId !== null
    ) {

        conditions.push(
            "t.sender_account_id = ?"
        );

        parameters.push(
            accountId
        );
    }


    /*
     * ========================================================
     * STATUS FILTER
     * ========================================================
     */

    if (status) {

        conditions.push(
            "t.status = ?"
        );

        parameters.push(
            status
        );
    }


    /*
     * ========================================================
     * TRANSACTION TYPE FILTER
     * ========================================================
     */

    if (transactionType) {

        conditions.push(
            "t.transaction_type = ?"
        );

        parameters.push(
            transactionType
        );
    }


    /*
     * ========================================================
     * FROM DATE
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


    /*
     * ========================================================
     * TO DATE
     * ========================================================
     */

    if (toDate) {

        conditions.push(
            "t.created_at <= ?"
        );

        parameters.push(
            `${toDate} 23:59:59`
        );
    }


    /*
     * ========================================================
     * MINIMUM AMOUNT
     * ========================================================
     */

    if (
        minAmount !== undefined &&
        minAmount !== null
    ) {

        conditions.push(
            "t.amount >= ?"
        );

        parameters.push(
            minAmount
        );
    }


    /*
     * ========================================================
     * MAXIMUM AMOUNT
     * ========================================================
     */

    if (
        maxAmount !== undefined &&
        maxAmount !== null
    ) {

        conditions.push(
            "t.amount <= ?"
        );

        parameters.push(
            maxAmount
        );
    }


    /*
     * ========================================================
     * SEARCH
     *
     * Existing search parameter.
     * ========================================================
     */

    if (search) {

        conditions.push(
            `(
                t.transaction_reference LIKE ?
                OR t.receiver_account_number LIKE ?
                OR t.remarks LIKE ?
                OR a.account_number LIKE ?
            )`
        );


        const searchValue =
            `%${search}%`;


        parameters.push(

            searchValue,

            searchValue,

            searchValue,

            searchValue

        );
    }


    /*
     * ========================================================
     * KEYWORD SEARCH
     *
     * Advanced search parameter.
     * ========================================================
     */

    if (keyword) {

        conditions.push(
            `(
                t.transaction_reference LIKE ?
                OR t.receiver_account_number LIKE ?
                OR t.remarks LIKE ?
                OR a.account_number LIKE ?
            )`
        );


        const keywordValue =
            `%${keyword}%`;


        parameters.push(

            keywordValue,

            keywordValue,

            keywordValue,

            keywordValue

        );
    }


    /*
     * ========================================================
     * WHERE CLAUSE
     * ========================================================
     */

    const whereClause =
        conditions.join(
            " AND "
        );


    /*
     * ========================================================
     * COUNT TRANSACTIONS
     * ========================================================
     */

    const [countRows] =
        await db.query(
            `
            SELECT
                COUNT(*) AS total

            FROM transactions t

            INNER JOIN accounts a
                ON t.sender_account_id = a.id

            WHERE ${whereClause}
            `,
            parameters
        );


    const total =
        Number(
            (countRows as any[])[0].total
        );


    /*
     * ========================================================
     * GET TRANSACTIONS
     * ========================================================
     */

    const [rows] =
        await db.query(
            `
            SELECT

                t.id,

                t.transaction_reference,

                t.sender_account_id,

                t.beneficiary_id,

                t.receiver_account_number,

                t.amount,

                t.transaction_type,

                t.status,

                t.remarks,

                t.created_at,

                t.updated_at,

                a.account_number
                    AS sender_account_number

            FROM transactions t

            INNER JOIN accounts a
                ON t.sender_account_id = a.id

            WHERE ${whereClause}

            ORDER BY
                ${safeSortBy}
                ${safeSortOrder},

                t.id DESC

            LIMIT ?
            OFFSET ?
            `,
            [
                ...parameters,

                safeLimit,

                offset

            ]
        );


    /*
     * ========================================================
     * PAGINATION INFORMATION
     * ========================================================
     */

    const totalPages =
        Math.ceil(
            total / safeLimit
        );


    return {

        transactions:
            rows,

        pagination: {

            page:
                safePage,

            limit:
                safeLimit,

            totalRecords:
                total,

            totalPages:
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
 * GET TRANSACTION DETAILS
 * ============================================================
 */

export async function getTransactionById(
    userId: number,
    transactionId: number
) {

    const [rows] =
        await db.query(
            `
            SELECT

                t.id,

                t.transaction_reference,

                t.sender_account_id,

                t.beneficiary_id,

                t.receiver_account_number,

                t.amount,

                t.transaction_type,

                t.status,

                t.remarks,

                t.created_at,

                t.updated_at,

                a.account_number
                    AS sender_account_number,

                b.beneficiary_name

            FROM transactions t

            INNER JOIN accounts a
                ON t.sender_account_id = a.id

            LEFT JOIN beneficiaries b
                ON t.beneficiary_id = b.id
                AND b.user_id = ?

            WHERE
                t.id = ?

                AND a.user_id = ?

            LIMIT 1
            `,
            [
                userId,
                transactionId,
                userId
            ]
        );


    const transactions =
        rows as any[];


    if (
        transactions.length === 0
    ) {

        throw new Error(
            "TRANSACTION_NOT_FOUND"
        );
    }


    return transactions[0];
}


/*
 * ============================================================
 * GET TRANSACTION RECEIPT
 * ============================================================
 */

export async function getTransactionReceipt(
    userId: number,
    transactionId: number
) {

    const [rows] =
        await db.query(
            `
            SELECT

                t.id,

                t.transaction_reference,

                t.amount,

                t.transaction_type,

                t.status,

                t.remarks,

                t.created_at,

                t.updated_at,

                t.sender_account_id,

                sender.account_number
                    AS sender_account_number,

                t.receiver_account_number,

                b.beneficiary_name
                    AS receiver_name

            FROM transactions t

            INNER JOIN accounts sender
                ON t.sender_account_id = sender.id

            LEFT JOIN beneficiaries b
                ON t.beneficiary_id = b.id

            WHERE

                t.id = ?

                AND sender.user_id = ?

            LIMIT 1
            `,
            [
                transactionId,
                userId
            ]
        );


    const transactions =
        rows as any[];


    if (
        transactions.length === 0
    ) {

        throw new Error(
            "TRANSACTION_NOT_FOUND"
        );
    }


    const transaction =
        transactions[0];


    return {

        transactionId:
            transaction.id,

        transactionReference:
            transaction.transaction_reference,

        transactionDate:
            transaction.created_at,

        senderAccount:
            transaction.sender_account_number,

        receiverName:
            transaction.receiver_name,

        receiverAccount:
            transaction.receiver_account_number,

        amount:
            Number(
                transaction.amount
            ),

        transactionType:
            transaction.transaction_type,

        status:
            transaction.status,

        remarks:
            transaction.remarks,

        updatedAt:
            transaction.updated_at

    };
}
export async function exportTransactionsToCSV(
    options: TransactionHistoryOptions
) {

    const {
        userId,
        status,
        transactionType,
        fromDate,
        toDate,
        minAmount,
        maxAmount,
        accountId,
        search,
        keyword,
        sortBy = "date",
        sortOrder = "DESC"
    } = options;


    /*
     * Safe sorting
     */

    const allowedSortColumns: Record<string, string> = {

        date: "t.created_at",
        amount: "t.amount",
        id: "t.id",
        status: "t.status",
        reference: "t.transaction_reference"

    };

    const safeSortBy =
        allowedSortColumns[sortBy] ||
        "t.created_at";

    const safeSortOrder =
        String(sortOrder).toUpperCase() === "ASC"
            ? "ASC"
            : "DESC";


    /*
     * Conditions
     */

    const conditions: string[] = [
        "a.user_id = ?"
    ];

    const parameters: any[] = [
        userId
    ];


    if (
        accountId !== undefined &&
        accountId !== null
    ) {

        conditions.push(
            "t.sender_account_id = ?"
        );

        parameters.push(accountId);
    }


    if (status) {

        conditions.push(
            "t.status = ?"
        );

        parameters.push(status);
    }


    if (transactionType) {

        conditions.push(
            "t.transaction_type = ?"
        );

        parameters.push(transactionType);
    }


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


    if (
        minAmount !== undefined &&
        minAmount !== null
    ) {

        conditions.push(
            "t.amount >= ?"
        );

        parameters.push(minAmount);
    }


    if (
        maxAmount !== undefined &&
        maxAmount !== null
    ) {

        conditions.push(
            "t.amount <= ?"
        );

        parameters.push(maxAmount);
    }


    const searchTerm =
        keyword || search;


    if (searchTerm) {

        conditions.push(
            `(
                t.transaction_reference LIKE ?
                OR t.receiver_account_number LIKE ?
                OR t.remarks LIKE ?
                OR a.account_number LIKE ?
            )`
        );

        const value =
            `%${searchTerm}%`;

        parameters.push(
            value,
            value,
            value,
            value
        );
    }


    const whereClause =
        conditions.join(" AND ");


    /*
     * Get transactions
     */

    const [rows] =
        await db.query(
            `
            SELECT

                t.id,

                t.transaction_reference,

                a.account_number
                    AS sender_account_number,

                t.receiver_account_number,

                t.amount,

                t.transaction_type,

                t.status,

                t.remarks,

                t.created_at

            FROM transactions t

            INNER JOIN accounts a
                ON t.sender_account_id = a.id

            WHERE ${whereClause}

            ORDER BY
                ${safeSortBy}
                ${safeSortOrder},
                t.id DESC
            `,
            parameters
        );


    const transactions =
        rows as any[];


    /*
     * CSV Header
     */

    const headers = [
        "Transaction ID",
        "Transaction Reference",
        "Sender Account",
        "Receiver Account",
        "Amount",
        "Transaction Type",
        "Status",
        "Remarks",
        "Transaction Date"
    ];


    /*
     * CSV Rows
     */

    const csvRows =
        transactions.map(
            (transaction) => {

                return [
                    transaction.id,
                    transaction.transaction_reference,
                    transaction.sender_account_number,
                    transaction.receiver_account_number,
                    transaction.amount,
                    transaction.transaction_type,
                    transaction.status,
                    transaction.remarks || "",
                    transaction.created_at
                ]
                    .map(
                        (value) =>
                            `"${String(value)
                                .replace(/"/g, '""')}"`
                    )
                    .join(",");
            }
        );


    /*
     * Final CSV
     */

    return [
        headers.join(","),
        ...csvRows
    ].join("\n");
}

/*
 * ============================================================
 * GET TRANSACTION SUMMARY
 * ============================================================
 */

export async function getTransactionSummary(
    userId: number
) {

    const [rows] = await db.query(
        `
        SELECT

            COUNT(*) AS totalTransactions,

            COALESCE(
                SUM(
                    CASE
                        WHEN status = 'SUCCESS'
                        THEN amount
                        ELSE 0
                    END
                ),
                0
            ) AS totalAmount,

            COALESCE(
                SUM(
                    CASE
                        WHEN status = 'SUCCESS'
                        THEN 1
                        ELSE 0
                    END
                ),
                0
            ) AS successfulTransactions,

            COALESCE(
                SUM(
                    CASE
                        WHEN status = 'FAILED'
                        THEN 1
                        ELSE 0
                    END
                ),
                0
            ) AS failedTransactions,

            COALESCE(
                SUM(
                    CASE
                        WHEN status = 'PENDING'
                        THEN 1
                        ELSE 0
                    END
                ),
                0
            ) AS pendingTransactions,

            COALESCE(
                SUM(
                    CASE
                        WHEN status = 'REVERSED'
                        THEN 1
                        ELSE 0
                    END
                ),
                0
            ) AS reversedTransactions

        FROM transactions t

        INNER JOIN accounts a
            ON t.sender_account_id = a.id

        WHERE a.user_id = ?
        `,
        [userId]
    );

    const summary = (rows as any[])[0];

    return {
        totalTransactions:
            Number(summary.totalTransactions),

        totalAmount:
            Number(summary.totalAmount),

        successfulTransactions:
            Number(summary.successfulTransactions),

        failedTransactions:
            Number(summary.failedTransactions),

        pendingTransactions:
            Number(summary.pendingTransactions),

        reversedTransactions:
            Number(summary.reversedTransactions)
    };
}/*
 * ============================================================
 * REVERSE TRANSACTION
 *
 * POST /api/transactions/:transactionId/reverse
 * ============================================================
 */

export async function reverseTransaction(
    userId: number,
    transactionId: number
) {

    const connection =
        await db.getConnection();

    try {

        await connection.beginTransaction();


        /*
         * 1. Get original transaction
         */

        const [transactionRows] =
            await connection.query(
                `
                SELECT
                    t.id,
                    t.transaction_reference,
                    t.sender_account_id,
                    t.beneficiary_id,
                    t.receiver_account_number,
                    t.amount,
                    t.transaction_type,
                    t.status,
                    t.remarks,

                    sender.user_id AS sender_user_id,

                    receiver.id AS receiver_account_id,
                    receiver.status AS receiver_status

                FROM transactions t

                INNER JOIN accounts sender
                    ON t.sender_account_id = sender.id

                LEFT JOIN accounts receiver
                    ON t.receiver_account_number =
                       receiver.account_number

                WHERE
                    t.id = ?
                    AND sender.user_id = ?

                FOR UPDATE
                `,
                [
                    transactionId,
                    userId
                ]
            );


        const transactions =
            transactionRows as any[];


        /*
         * 2. Transaction not found
         */

        if (transactions.length === 0) {

            throw new Error(
                "TRANSACTION_NOT_FOUND"
            );
        }


        const transaction =
            transactions[0];


        /*
         * 3. Only successful transactions
         * can be reversed.
         */

        if (
            transaction.status !==
            "SUCCESS"
        ) {

            throw new Error(
                "TRANSACTION_NOT_REVERSIBLE"
            );
        }


        /*
         * 4. Beneficiary must exist
         */

        if (
            !transaction.beneficiary_id
        ) {

            throw new Error(
                "BENEFICIARY_NOT_FOUND"
            );
        }


        /*
         * 5. Receiver account must exist
         */

        if (
            !transaction.receiver_account_id
        ) {

            throw new Error(
                "RECEIVER_ACCOUNT_NOT_FOUND"
            );
        }


        /*
         * 6. Receiver must be active
         */

        if (
            transaction.receiver_status !==
            "ACTIVE"
        ) {

            throw new Error(
                "RECEIVER_ACCOUNT_INACTIVE"
            );
        }


        /*
         * 7. Lock sender account
         */

        const [senderRows] =
            await connection.query(
                `
                SELECT
                    id,
                    account_number,
                    balance,
                    status

                FROM accounts

                WHERE id = ?

                FOR UPDATE
                `,
                [
                    transaction.sender_account_id
                ]
            );


        const senders =
            senderRows as any[];


        if (senders.length === 0) {

            throw new Error(
                "SENDER_ACCOUNT_NOT_FOUND"
            );
        }


        const sender =
            senders[0];


        /*
         * 8. Lock receiver account
         */

        const [receiverRows] =
            await connection.query(
                `
                SELECT
                    id,
                    account_number,
                    balance,
                    status

                FROM accounts

                WHERE id = ?

                FOR UPDATE
                `,
                [
                    transaction.receiver_account_id
                ]
            );


        const receivers =
            receiverRows as any[];


        if (receivers.length === 0) {

            throw new Error(
                "RECEIVER_ACCOUNT_NOT_FOUND"
            );
        }


        const receiver =
            receivers[0];


        /*
         * 9. Check receiver balance
         */

        const receiverBalance =
            Number(receiver.balance);

        const amount =
            Number(transaction.amount);


        if (
            receiverBalance < amount
        ) {

            throw new Error(
                "RECEIVER_INSUFFICIENT_BALANCE"
            );
        }


        /*
         * 10. Generate reversal reference
         */

        const reversalReference =
            "REV" +
            Date.now() +
            Math.floor(
                Math.random() * 1000
            );


        /*
         * 11. Debit receiver
         */

        const [debitResult]: any =
            await connection.query(
                `
                UPDATE accounts

                SET balance =
                    balance - ?

                WHERE
                    id = ?
                    AND balance >= ?
                `,
                [
                    amount,
                    receiver.id,
                    amount
                ]
            );


        /*
         * Make sure debit actually happened
         */

        if (
            debitResult.affectedRows !== 1
        ) {

            throw new Error(
                "RECEIVER_INSUFFICIENT_BALANCE"
            );
        }


        /*
         * 12. Credit sender
         */

        await connection.query(
            `
            UPDATE accounts

            SET balance =
                balance + ?

            WHERE id = ?
            `,
            [
                amount,
                sender.id
            ]
        );


        /*
         * 13. Update original transaction
         */

        await connection.query(
            `
            UPDATE transactions

            SET
                status = 'REVERSED',
                updated_at = CURRENT_TIMESTAMP

            WHERE id = ?
            `,
            [
                transactionId
            ]
        );


        /*
         * 14. Create reversal transaction
         *
         * beneficiary_id is required by
         * the transactions table.
         */

        await connection.query(
            `
            INSERT INTO transactions
            (
                transaction_reference,
                sender_account_id,
                beneficiary_id,
                receiver_account_number,
                amount,
                transaction_type,
                status,
                remarks
            )

            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                reversalReference,

                sender.id,

                transaction.beneficiary_id,

                receiver.account_number,

                amount,

                "REVERSAL",

                "SUCCESS",

                `Reversal of ${transaction.transaction_reference}`
            ]
        );


        /*
         * 15. Commit
         */

        await connection.commit();
/*
 * 16. Create reversal notification
 */

await createNotification(
    userId,
    "Fund Transfer Reversed",
    `Your fund transfer ${transaction.transaction_reference} of ₹${amount} has been reversed successfully.`,
    "TRANSFER"
);

        /*
         * 16. Return result
         */

        return {

            originalTransactionId:
                transaction.id,

            originalTransactionReference:
                transaction.transaction_reference,

            reversalReference,

            amount,

            status:
                "REVERSED",

            senderAccount:
                sender.account_number,

            receiverAccount:
                receiver.account_number,

            beneficiaryId:
                transaction.beneficiary_id
        };

    } catch (error) {

        /*
         * Rollback everything
         */

        await connection.rollback();

        throw error;

    } finally {

        connection.release();
    }
}