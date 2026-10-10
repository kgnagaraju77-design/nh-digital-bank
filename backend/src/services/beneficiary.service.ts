import { db } from "../config/database";

import {
    createNotification
} from "./notification.service";

interface CreateBeneficiaryRequest {

    userId: number;

    beneficiaryName: string;

    accountNumber: string;

    bankName: string;

    ifscCode: string;
}
interface UpdateBeneficiaryRequest {
    userId: number;
    beneficiaryId: number;
    beneficiaryName?: string;
    accountNumber?: string;
    bankName?: string;
    ifscCode?: string;
}


/*
 * ============================================================
 * CREATE BENEFICIARY
 * ============================================================
 */

export async function createBeneficiary(
    data: CreateBeneficiaryRequest
) {

    const connection =
        await db.getConnection();

    try {

        await connection.beginTransaction();

        /*
         * 1. Validate beneficiary name
         */

        const beneficiaryName =
            data.beneficiaryName?.trim();

        if (!beneficiaryName) {
            throw new Error(
                "INVALID_BENEFICIARY_NAME"
            );
        }

        /*
         * 2. Validate account number
         */

        const accountNumber =
            data.accountNumber?.trim();

        if (!accountNumber) {
            throw new Error(
                "INVALID_ACCOUNT_NUMBER"
            );
        }

        /*
         * 3. Check whether account exists
         */

        const [accountRows] =
            await connection.query(
                `
                SELECT
                    id,
                    account_number,
                    status

                FROM accounts

                WHERE account_number = ?

                LIMIT 1
                `,
                [accountNumber]
            );

        const accounts =
            accountRows as any[];

        if (accounts.length === 0) {
            throw new Error(
                "ACCOUNT_NOT_FOUND"
            );
        }

        /*
         * 4. Account must be active
         */

        if (
            accounts[0].status !==
            "ACTIVE"
        ) {
            throw new Error(
                "ACCOUNT_INACTIVE"
            );
        }

        /*
         * 5. Prevent adding own account
         */

        const [ownAccountRows] =
            await connection.query(
                `
                SELECT id

                FROM accounts

                WHERE
                    id = ?
                    AND user_id = ?

                LIMIT 1
                `,
                [
                    accounts[0].id,
                    data.userId
                ]
            );

        const ownAccounts =
            ownAccountRows as any[];

        if (ownAccounts.length > 0) {
            throw new Error(
                "CANNOT_ADD_OWN_ACCOUNT"
            );
        }

        /*
         * 6. Prevent duplicate beneficiary
         */

        const [duplicateRows] =
            await connection.query(
                `
                SELECT
                    id,
                    status

                FROM beneficiaries

                WHERE
                    user_id = ?
                    AND account_number = ?

                LIMIT 1
                `,
                [
                    data.userId,
                    accountNumber
                ]
            );

        const duplicates =
            duplicateRows as any[];

        if (duplicates.length > 0) {

            if (
                duplicates[0].status ===
                "ACTIVE"
            ) {
                throw new Error(
                    "BENEFICIARY_ALREADY_EXISTS"
                );
            }

            throw new Error(
                "BENEFICIARY_ALREADY_EXISTS"
            );
        }

        /*
         * 7. Create beneficiary
         */

        const [result] =
    await connection.query(
        `
        INSERT INTO beneficiaries
        (
            user_id,
            beneficiary_name,
            account_number,
            bank_name,
            ifsc_code,
            status
        )

        VALUES (?, ?, ?, ?, ?, 'ACTIVE')
        `,
        [
            data.userId,
            beneficiaryName,
            accountNumber,
            data.bankName,
            data.ifscCode
        ]
    );

        await connection.commit();


/*
 * 8. Create beneficiary notification
 */

await createNotification(
    data.userId,
    "Beneficiary Added",
    `Beneficiary ${beneficiaryName} was added successfully.`,
    "BENEFICIARY"
);


const insertResult =
    result as any;
return {
    id: insertResult.insertId,
    beneficiaryName,
    accountNumber,
    bankName: data.bankName,
    ifscCode: data.ifscCode,
    status: "ACTIVE"
};

    } catch (error) {

        await connection.rollback();

        throw error;

    } finally {

        connection.release();
    }
}


/*
 * ============================================================
 * GET ALL BENEFICIARIES
 * ============================================================
 */

export async function getBeneficiaries(
    userId: number
) {

    const [rows] =
        await db.query(
            `
            SELECT
    id,
    beneficiary_name,
    account_number,
    bank_name,
    ifsc_code,
    status,
    created_at,
    updated_at

            FROM beneficiaries

            WHERE user_id = ?

            ORDER BY
                created_at DESC,
                id DESC
            `,
            [userId]
        );

    return rows;
}


/*
 * ============================================================
 * GET BENEFICIARY BY ID
 * ============================================================
 */

export async function getBeneficiaryById(
    userId: number,
    beneficiaryId: number
) {

    const [rows] =
        await db.query(
            `
            SELECT
    id,
    beneficiary_name,
    account_number,
    bank_name,
    ifsc_code,
    status,
    created_at,
    updated_at
FROM beneficiaries
WHERE id = ?
AND user_id = ?
LIMIT 1
            `,
            [
                beneficiaryId,
                userId
            ]
        );

    const beneficiaries =
        rows as any[];

    if (
        beneficiaries.length === 0
    ) {
        throw new Error(
            "BENEFICIARY_NOT_FOUND"
        );
    }

    return beneficiaries[0];
}


/*
 * ============================================================
 * UPDATE BENEFICIARY
 * ============================================================
 */

export async function updateBeneficiary(
    data: UpdateBeneficiaryRequest
) {

    const connection =
        await db.getConnection();

    try {

        await connection.beginTransaction();

       /*
 * 1. Check beneficiary ownership
 */

const [beneficiaryRows] =
    await connection.query(
        `
        SELECT
            id,
            beneficiary_name,
            account_number,
            bank_name,
            ifsc_code,
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
         * 2. Build update values
         */

        const beneficiaryName =
            data.beneficiaryName !== undefined
                ? data.beneficiaryName.trim()
                : beneficiary.beneficiary_name;

        const accountNumber =
            data.accountNumber !== undefined
                ? data.accountNumber.trim()
                : beneficiary.account_number;
                const bankName =
    data.bankName !== undefined
        ? data.bankName.trim()
        : beneficiary.bank_name;

const ifscCode =
    data.ifscCode !== undefined
        ? data.ifscCode.trim()
        : beneficiary.ifsc_code;

        if (!beneficiaryName) {
            throw new Error(
                "INVALID_BENEFICIARY_NAME"
            );
        }

        if (!accountNumber) {
            throw new Error(
                "INVALID_ACCOUNT_NUMBER"
            );
        }

        /*
         * 3. Check target account
         */

        const [accountRows] =
            await connection.query(
                `
                SELECT
                    id,
                    status

                FROM accounts

                WHERE account_number = ?

                LIMIT 1
                `,
                [accountNumber]
            );

        const accounts =
            accountRows as any[];

        if (accounts.length === 0) {
            throw new Error(
                "ACCOUNT_NOT_FOUND"
            );
        }

        if (
            accounts[0].status !==
            "ACTIVE"
        ) {
            throw new Error(
                "ACCOUNT_INACTIVE"
            );
        }

        /*
         * 4. Prevent own account
         */

        const [ownRows] =
            await connection.query(
                `
                SELECT id

                FROM accounts

                WHERE
                    id = ?
                    AND user_id = ?

                LIMIT 1
                `,
                [
                    accounts[0].id,
                    data.userId
                ]
            );

        if (
            (ownRows as any[]).length > 0
        ) {
            throw new Error(
                "CANNOT_ADD_OWN_ACCOUNT"
            );
        }

        /*
         * 5. Check duplicate account
         */

        const [duplicateRows] =
            await connection.query(
                `
                SELECT id

                FROM beneficiaries

                WHERE
                    user_id = ?
                    AND account_number = ?
                    AND id != ?

                LIMIT 1
                `,
                [
                    data.userId,
                    accountNumber,
                    data.beneficiaryId
                ]
            );

        if (
            (duplicateRows as any[]).length > 0
        ) {
            throw new Error(
                "BENEFICIARY_ALREADY_EXISTS"
            );
        }

        /*
         * 6. Update
         */

        await connection.query(
            `
            UPDATE beneficiaries

            SET
                beneficiary_name = ?,
                account_number = ?

            WHERE
                id = ?
                AND user_id = ?
            `,
            [
                beneficiaryName,
                accountNumber,
                data.beneficiaryId,
                data.userId
            ]
        );

        await connection.commit();
await createNotification(
    data.userId,
    "Beneficiary Updated",
    `Beneficiary ${beneficiaryName} was updated successfully.`,
    "BENEFICIARY"
);
        return {
            id: data.beneficiaryId,
            beneficiaryName,
            accountNumber,
            status: beneficiary.status
        };

    } catch (error) {

        await connection.rollback();

        throw error;

    } finally {

        connection.release();
    }
}


/*
 * ============================================================
 * CHANGE BENEFICIARY STATUS
 * ============================================================
 */

export async function updateBeneficiaryStatus(
    userId: number,
    beneficiaryId: number,
    status: "ACTIVE" | "BLOCKED" | "DELETED"
) {

    /*
     * 1. Update beneficiary status
     */

    const [result] =
        await db.query(
            `
            UPDATE beneficiaries

            SET
                status = ?

            WHERE
                id = ?
                AND user_id = ?
            `,
            [
                status,
                beneficiaryId,
                userId
            ]
        );


    const updateResult =
        result as any;


    /*
     * 2. Check beneficiary exists
     */

    if (
        updateResult.affectedRows === 0
    ) {

        throw new Error(
            "BENEFICIARY_NOT_FOUND"
        );
    }


    /*
     * 3. Create notification
     */

    await createNotification(
        userId,
        "Beneficiary Status Updated",
        `Beneficiary status changed to ${status}.`,
        "BENEFICIARY"
    );


    /*
     * 4. Return result
     */

    return {

        id:
            beneficiaryId,

        status
    };
}
/*
 * ============================================================
 * DELETE BENEFICIARY
 *
 * Soft delete beneficiary by changing status to DELETED.
 * ============================================================
 */

export async function deleteBeneficiary(
    userId: number,
    beneficiaryId: number
) {

    /*
     * 1. Soft delete beneficiary
     */

    const [result] =
        await db.query(
            `
            UPDATE beneficiaries

            SET
                status = 'DELETED'

            WHERE
                id = ?
                AND user_id = ?
                AND status != 'DELETED'
            `,
            [
                beneficiaryId,
                userId
            ]
        );


    const deleteResult =
        result as any;


    /*
     * 2. Check beneficiary exists
     */

    if (
        deleteResult.affectedRows === 0
    ) {

        throw new Error(
            "BENEFICIARY_NOT_FOUND"
        );
    }


    /*
     * 3. Create notification
     */

    await createNotification(
        userId,
        "Beneficiary Deleted",
        "Beneficiary was deleted successfully.",
        "BENEFICIARY"
    );


    /*
     * 4. Return result
     */

    return {

        id:
            beneficiaryId,

        deleted:
            true,

        status:
            "DELETED"

    };
}