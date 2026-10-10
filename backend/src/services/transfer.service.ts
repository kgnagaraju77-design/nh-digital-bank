import { db } from "../config/database";

import {
    createNotification
} from "./notification.service";


interface TransferRequest {

    userId: number;

    senderAccountId: number;

    beneficiaryId: number;

    amount: number;

    remarks?: string;
}


/*
 * ============================================================
 * FUND TRANSFER
 *
 * POST /api/transfers
 *
 * Flow:
 *
 * 1. Validate sender account
 * 2. Validate beneficiary
 * 3. Validate receiver account
 * 4. Validate amount
 * 5. Check sufficient balance
 * 6. Prevent self transfer
 * 7. Debit sender
 * 8. Credit receiver
 * 9. Create transaction record
 * 10. Commit transaction
 *
 * ============================================================
 */

export async function transferMoney(data: TransferRequest) {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        if (!Number.isFinite(data.amount) || data.amount <= 0) {
            throw new Error("INVALID_AMOUNT");
        }

        const decimalAmount = Math.round(data.amount * 100) / 100;
        if (decimalAmount !== data.amount || decimalAmount <= 0) {
            throw new Error("INVALID_AMOUNT");
        }

        // Validate sender. No debit happens during initiation.
        const [accountRows] = await connection.query(`
            SELECT id, user_id, account_number, balance, status
            FROM accounts
            WHERE id = ? AND user_id = ?
            FOR UPDATE
        `, [data.senderAccountId, data.userId]);
        const accounts = accountRows as any[];
        if (accounts.length === 0) throw new Error("SENDER_ACCOUNT_NOT_FOUND");
        const senderAccount = accounts[0];
        if (senderAccount.status !== "ACTIVE") throw new Error("SENDER_ACCOUNT_INACTIVE");

        // Validate beneficiary.
        const [beneficiaryRows] = await connection.query(`
            SELECT id, user_id, beneficiary_name, account_number, bank_name, ifsc_code, status
            FROM beneficiaries
            WHERE id = ? AND user_id = ?
            FOR UPDATE
        `, [data.beneficiaryId, data.userId]);
        const beneficiaries = beneficiaryRows as any[];
        if (beneficiaries.length === 0) throw new Error("BENEFICIARY_NOT_FOUND");
        const beneficiary = beneficiaries[0];
        if (beneficiary.status !== "ACTIVE") throw new Error("BENEFICIARY_INACTIVE");

        // Validate receiver account.
        const [receiverRows] = await connection.query(`
            SELECT id, account_number, status
            FROM accounts
            WHERE account_number = ?
            FOR UPDATE
        `, [beneficiary.account_number]);
        const receivers = receiverRows as any[];
        if (receivers.length === 0) throw new Error("RECEIVER_ACCOUNT_NOT_FOUND");
        const receiverAccount = receivers[0];
        if (receiverAccount.status !== "ACTIVE") throw new Error("RECEIVER_ACCOUNT_INACTIVE");

        if (Number(receiverAccount.id) === Number(data.senderAccountId)) {
            throw new Error("SELF_TRANSFER_NOT_ALLOWED");
        }

        // Pre-check balance. Final balance check happens again at confirmation.
        const senderBalance = Number(senderAccount.balance);
        if (!Number.isFinite(senderBalance) || senderBalance < decimalAmount) {
            throw new Error("INSUFFICIENT_BALANCE");
        }

        const transactionReference =
            "TXN" + Date.now() + Math.floor(Math.random() * 1000);

        // IMPORTANT: create only a PENDING transaction.
        // Do NOT debit or credit accounts here.
        const [insertResult]: any = await connection.query(`
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
            VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?)
        `, [
            transactionReference,
            data.senderAccountId,
            data.beneficiaryId,
            beneficiary.account_number,
            decimalAmount,
            "FUND_TRANSFER",
            data.remarks !== undefined ? data.remarks.trim() : null
        ]);

        const transactionId = Number(insertResult.insertId);
        if (!Number.isInteger(transactionId) || transactionId <= 0) {
            throw new Error("TRANSACTION_CREATION_FAILED");
        }

        await connection.commit();

        return {
            transactionId,
            transactionReference,
            amount: decimalAmount,
            status: "PENDING",
            senderAccount: senderAccount.account_number,
            receiverAccount: beneficiary.account_number,
            beneficiaryId: data.beneficiaryId
        };

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}


export async function confirmTransfer(
    userId: number,
    transactionId: number
) {

    const connection =
        await db.getConnection();

    try {

        await connection.beginTransaction();


        /*
         * 1. Get pending transaction
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

        if (
            transactions.length === 0
        ) {

            throw new Error(
                "TRANSACTION_NOT_FOUND"
            );
        }


        const transaction =
            transactions[0];


        /*
         * 3. Transaction must be PENDING
         */

        if (
            transaction.status !==
            "PENDING"
        ) {

            throw new Error(
                "TRANSACTION_NOT_PENDING"
            );
        }


        /*
         * 4. Receiver account must exist
         */

        if (
            !transaction.receiver_account_id
        ) {

            throw new Error(
                "RECEIVER_ACCOUNT_NOT_FOUND"
            );
        }


        /*
         * 5. Lock sender account
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


        if (
            senders.length === 0
        ) {

            throw new Error(
                "SENDER_ACCOUNT_NOT_FOUND"
            );
        }


        const sender =
            senders[0];


        /*
         * 6. Sender must be active
         */

        if (
            sender.status !== "ACTIVE"
        ) {

            throw new Error(
                "SENDER_ACCOUNT_INACTIVE"
            );
        }


        /*
         * 7. Lock receiver account
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


        if (
            receivers.length === 0
        ) {

            throw new Error(
                "RECEIVER_ACCOUNT_NOT_FOUND"
            );
        }


        const receiver =
            receivers[0];


        /*
         * 8. Receiver must be active
         */

        if (
            receiver.status !== "ACTIVE"
        ) {

            throw new Error(
                "RECEIVER_ACCOUNT_INACTIVE"
            );
        }


        /*
         * 9. Check balance
         */

        const amount =
            Number(transaction.amount);

        const senderBalance =
            Number(sender.balance);


        if (
            senderBalance < amount
        ) {

            throw new Error(
                "INSUFFICIENT_BALANCE"
            );
        }


        /*
         * 10. Debit sender
         */

        const [debitResult]: any =
            await connection.query(
                `
                UPDATE accounts

                SET
                    balance = balance - ?

                WHERE
                    id = ?
                    AND balance >= ?
                `,
                [
                    amount,
                    sender.id,
                    amount
                ]
            );


        if (
            debitResult.affectedRows !== 1
        ) {

            throw new Error(
                "INSUFFICIENT_BALANCE"
            );
        }


        /*
         * 11. Credit receiver
         */

        await connection.query(
            `
            UPDATE accounts

            SET
                balance = balance + ?

            WHERE id = ?
            `,
            [
                amount,
                receiver.id
            ]
        );


        /*
         * 12. Update transaction
         */

        await connection.query(
            `
            UPDATE transactions

            SET
                status = 'SUCCESS',
                updated_at = CURRENT_TIMESTAMP

            WHERE
                id = ?
                AND status = 'PENDING'
            `,
            [
                transactionId
            ]
        );


        /*
         * 13. Commit
         */

        await connection.commit();


        /*
         * 14. Return successful transfer
         */

        return {

            transactionId:
                transaction.id,

            transactionReference:
                transaction.transaction_reference,

            amount,

            status:
                "SUCCESS",

            senderAccount:
                sender.account_number,

            receiverAccount:
                receiver.account_number,

            beneficiaryId:
                transaction.beneficiary_id

        };

    } catch (error) {

        await connection.rollback();

        throw error;

    } finally {

        connection.release();
    }
}