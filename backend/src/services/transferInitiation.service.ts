import { db } from "../config/database";


/*
 * ============================================================
 * INITIATE FUND TRANSFER
 *
 * Creates a PENDING transaction.
 * No money is moved at this stage.
 * ============================================================
 */

export interface InitiateTransferRequest {

    userId: number;

    senderAccountId: number;

    beneficiaryId: number;

    amount: number;

    remarks?: string;
}


export async function initiateTransfer(
    data: InitiateTransferRequest
) {

    const connection =
        await db.getConnection();

    try {

        await connection.beginTransaction();


        /*
         * 1. Validate sender account
         */

        const [senderRows] =
            await connection.query(
                `
                SELECT
                    id,
                    account_number,
                    balance,
                    status,
                    user_id

                FROM accounts

                WHERE
                    id = ?
                    AND user_id = ?

                FOR UPDATE
                `,
                [
                    data.senderAccountId,
                    data.userId
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
         * 2. Sender account must be active
         */

        if (
            sender.status !== "ACTIVE"
        ) {

            throw new Error(
                "SENDER_ACCOUNT_INACTIVE"
            );
        }


        /*
         * 3. Validate beneficiary ownership
         */

        const [beneficiaryRows] =
            await connection.query(
                `
                SELECT
                    id,
                    beneficiary_name,
                    account_number,
                    status

                FROM beneficiaries

                WHERE
                    id = ?
                    AND user_id = ?

                FOR UPDATE
                `,
                [
                    data.beneficiaryId,
                    data.userId
                ]
            );


        const beneficiaries =
            beneficiaryRows as any[];


        if (
            beneficiaries.length === 0
        ) {

            throw new Error(
                "BENEFICIARY_NOT_FOUND"
            );
        }


        const beneficiary =
            beneficiaries[0];


        /*
         * 4. Beneficiary must be active
         */

        if (
            beneficiary.status !== "ACTIVE"
        ) {

            throw new Error(
                "BENEFICIARY_INACTIVE"
            );
        }


        /*
         * 5. Prevent self transfer
         */

        if (
            sender.account_number ===
            beneficiary.account_number
        ) {

            throw new Error(
                "SELF_TRANSFER_NOT_ALLOWED"
            );
        }


        /*
         * 6. Validate receiver account
         */

        const [receiverRows] =
            await connection.query(
                `
                SELECT
                    id,
                    account_number,
                    status

                FROM accounts

                WHERE
                    account_number = ?

                LIMIT 1
                `,
                [
                    beneficiary.account_number
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
         * 7. Receiver must be active
         */

        if (
            receiver.status !== "ACTIVE"
        ) {

            throw new Error(
                "RECEIVER_ACCOUNT_INACTIVE"
            );
        }


        /*
         * 8. Validate amount
         */

        const amount =
            Number(data.amount);


        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {

            throw new Error(
                "INVALID_AMOUNT"
            );
        }


        /*
         * 9. Check sender balance
         *
         * We check balance during initiation,
         * but money is NOT deducted yet.
         */

        if (
            Number(sender.balance) < amount
        ) {

            throw new Error(
                "INSUFFICIENT_BALANCE"
            );
        }


        /*
         * 10. Generate transaction reference
         */

        const transactionReference =
            "TXN" +
            Date.now() +
            Math.floor(
                Math.random() * 1000
            );


        /*
         * 11. Create PENDING transaction
         */

        const [result] =
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

                    transactionReference,

                    sender.id,

                    beneficiary.id,

                    receiver.account_number,

                    amount,

                    "FUND_TRANSFER",

                    "PENDING",

                    data.remarks || null

                ]
            );


        const insertResult =
            result as any;


        /*
         * 12. Commit
         */

        await connection.commit();


        /*
         * 13. Return pending transaction
         */

        return {

            transactionId:
                insertResult.insertId,

            transactionReference,

            amount,

            status:
                "PENDING",

            senderAccount:
                sender.account_number,

            receiverAccount:
                receiver.account_number,

            beneficiaryId:
                beneficiary.id

        };

    } catch (error) {

        await connection.rollback();

        throw error;

    } finally {

        connection.release();
    }
}