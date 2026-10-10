import bcrypt from "bcrypt";

import { db } from "../config/database";


/*
 * ============================================================
 * OTP TYPES
 * ============================================================
 */

export type OtpPurpose =
    | "FUND_TRANSFER"
    | "LOGIN"
    | "PASSWORD_RESET"
    | "BENEFICIARY";


interface GenerateOtpRequest {

    userId: number;

    transactionId?: number;

    purpose?: OtpPurpose;
}


/*
 * ============================================================
 * GENERATE OTP
 *
 * Generates a 6-digit OTP, hashes it using bcrypt,
 * stores the hash in the database and returns the
 * plain OTP for testing/sending purposes.
 * ============================================================
 */

export async function generateOtp(
    data: GenerateOtpRequest
) {

    /*
     * 1. Generate 6-digit OTP
     */

    const otp =
        Math.floor(
            100000 +
            Math.random() * 900000
        ).toString();


    /*
     * 2. Hash OTP
     */

    const otpHash =
        await bcrypt.hash(
            otp,
            10
        );


    /*
     * 3. OTP expiry
     *
     * OTP is valid for 5 minutes.
     */

    const expiresAt =
        new Date(
            Date.now() +
            5 * 60 * 1000
        );


    /*
     * 4. Purpose
     */

    const purpose =
        data.purpose ||
        "FUND_TRANSFER";


    /*
     * 5. Invalidate previous active OTPs
     *
     * This prevents multiple active OTPs
     * for the same purpose.
     */

    await db.query(
        `
        UPDATE transaction_otps

        SET
            status = 'EXPIRED',
            updated_at = CURRENT_TIMESTAMP

        WHERE
            user_id = ?
            AND purpose = ?
            AND status = 'ACTIVE'
        `,
        [
            data.userId,
            purpose
        ]
    );


    /*
     * 6. Insert new OTP
     */

    const [result] =
        await db.query(
            `
            INSERT INTO transaction_otps
            (
                user_id,
                transaction_id,
                otp_hash,
                purpose,
                expires_at,
                failed_attempts,
                status
            )

            VALUES (?, ?, ?, ?, ?, 0, 'ACTIVE')
            `,
            [
                data.userId,
                data.transactionId || null,
                otpHash,
                purpose,
                expiresAt
            ]
        );


    const insertResult =
        result as any;


    /*
     * 7. Return OTP
     *
     * In a real banking application the plain OTP
     * would be sent through SMS/email.
     *
     * For our testing application we return it.
     */

    return {

        id:
            insertResult.insertId,

        otp,

        purpose,

        expiresAt

    };
}


/*
 * ============================================================
 * VERIFY OTP
 * ============================================================
 */

export async function verifyOtp(
    userId: number,
    otp: string,
    transactionId: number | undefined,
    purpose: OtpPurpose = "FUND_TRANSFER"
){

    /*
     * 1. Validate OTP format
     */

    if (
        !/^\d{6}$/.test(otp)
    ) {

        throw new Error(
            "INVALID_OTP"
        );
    }


    /*
 * 2. Get active OTP
 */

const [rows] =
    await db.query(
        `
        SELECT
            id,
            user_id,
            transaction_id,
            otp_hash,
            purpose,
            expires_at,
            failed_attempts,
            status

        FROM transaction_otps

        WHERE
            user_id = ?
            AND purpose = ?
            AND status = 'ACTIVE'
            AND transaction_id = ?

        ORDER BY id DESC

        LIMIT 1
        `,
        [
            userId,
            purpose,
            transactionId
        ]
    );

    const otps =
        rows as any[];


    /*
     * 3. OTP not found
     */

    if (otps.length === 0) {

        throw new Error(
            "OTP_NOT_FOUND"
        );
    }


    const otpRecord =
        otps[0];


    /*
     * 4. Check expiry
     */

    const expiresAt =
        new Date(
            otpRecord.expires_at
        );


    if (
        Date.now() >=
        expiresAt.getTime()
    ) {

        await db.query(
            `
            UPDATE transaction_otps

            SET
                status = 'EXPIRED',
                updated_at = CURRENT_TIMESTAMP

            WHERE id = ?
            `,
            [
                otpRecord.id
            ]
        );


        throw new Error(
            "OTP_EXPIRED"
        );
    }


    /*
     * 5. Maximum attempts
     */

    if (
        Number(
            otpRecord.failed_attempts
        ) >= 5
    ) {

        await db.query(
            `
            UPDATE transaction_otps

            SET
                status = 'BLOCKED',
                updated_at = CURRENT_TIMESTAMP

            WHERE id = ?
            `,
            [
                otpRecord.id
            ]
        );


        throw new Error(
            "OTP_BLOCKED"
        );
    }


    /*
     * 6. Compare OTP
     */

    const otpValid =
        await bcrypt.compare(
            otp,
            otpRecord.otp_hash
        );


    /*
     * 7. Invalid OTP
     */

    if (!otpValid) {

        const failedAttempts =
            Number(
                otpRecord.failed_attempts
            ) + 1;


        /*
         * Block after 5 failed attempts
         */

        if (
            failedAttempts >= 5
        ) {

            await db.query(
                `
                UPDATE transaction_otps

                SET
                    failed_attempts = ?,
                    status = 'BLOCKED',
                    updated_at = CURRENT_TIMESTAMP

                WHERE id = ?
                `,
                [
                    failedAttempts,
                    otpRecord.id
                ]
            );


            throw new Error(
                "OTP_BLOCKED"
            );
        }


        /*
         * Update failed attempts
         */

        await db.query(
            `
            UPDATE transaction_otps

            SET
                failed_attempts = ?,
                updated_at = CURRENT_TIMESTAMP

            WHERE id = ?
            `,
            [
                failedAttempts,
                otpRecord.id
            ]
        );


        throw new Error(
            "INVALID_OTP"
        );
    }


    /*
     * 8. Mark OTP as verified
     */

    await db.query(
        `
        UPDATE transaction_otps

        SET
            status = 'VERIFIED',
            updated_at = CURRENT_TIMESTAMP

        WHERE id = ?
        `,
        [
            otpRecord.id
        ]
    );


    /*
     * 9. Return verification result
     */

    return {

        verified: true,

        otpId:
            otpRecord.id,

        transactionId:
            otpRecord.transaction_id,

        purpose:
            otpRecord.purpose

    };
}