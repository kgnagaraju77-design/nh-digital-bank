import bcrypt from "bcrypt";
import { db } from "../config/database";


/*
 * ============================================================
 * SET TRANSACTION PIN
 * ============================================================
 */

export async function setTransactionPin(
    userId: number,
    pin: string
) {

    /*
     * 1. Validate PIN
     */

    if (!/^\d{6}$/.test(pin)) {
        throw new Error(
            "INVALID_PIN"
        );
    }


    /*
     * 2. Check whether PIN already exists
     */

    const [rows] =
        await db.query(
            `
            SELECT
                id,
                status

            FROM transaction_pins

            WHERE user_id = ?

            LIMIT 1
            `,
            [userId]
        );


    const pins =
        rows as any[];


    if (pins.length > 0) {

        throw new Error(
            "PIN_ALREADY_EXISTS"
        );
    }


    /*
     * 3. Hash PIN
     */

    const pinHash =
        await bcrypt.hash(
            pin,
            10
        );


    /*
     * 4. Save PIN
     */

    const [result] =
        await db.query(
            `
            INSERT INTO transaction_pins
            (
                user_id,
                pin_hash,
                failed_attempts,
                status
            )

            VALUES (?, ?, 0, 'ACTIVE')
            `,
            [
                userId,
                pinHash
            ]
        );


    const insertResult =
        result as any;


    /*
     * 5. Return result
     */

    return {

        id:
            insertResult.insertId,

        status:
            "ACTIVE"

    };
}


/*
 * ============================================================
 * VERIFY TRANSACTION PIN
 * ============================================================
 */

export async function verifyTransactionPin(
    userId: number,
    pin: string
) {

    /*
     * 1. Validate PIN format
     */

    if (!/^\d{6}$/.test(pin)) {

        throw new Error(
            "INVALID_PIN"
        );
    }


    /*
     * 2. Get transaction PIN
     */

    const [rows] =
        await db.query(
            `
            SELECT
                id,
                pin_hash,
                failed_attempts,
                status

            FROM transaction_pins

            WHERE user_id = ?

            LIMIT 1
            `,
            [userId]
        );


    const pins =
        rows as any[];


    /*
     * 3. PIN not found
     */

    if (pins.length === 0) {

        throw new Error(
            "PIN_NOT_SET"
        );
    }


    const pinRecord =
        pins[0];


    /*
     * 4. Check PIN status
     */

    if (
        pinRecord.status !==
        "ACTIVE"
    ) {

        throw new Error(
            "PIN_BLOCKED"
        );
    }


    /*
     * 5. Compare PIN
     */

    const valid =
        await bcrypt.compare(
            pin,
            pinRecord.pin_hash
        );


    /*
     * 6. Wrong PIN
     */

    if (!valid) {

        const failedAttempts =
            Number(
                pinRecord.failed_attempts || 0
            ) + 1;


        /*
         * Block after 5 failures
         */

        if (
            failedAttempts >= 5
        ) {

            await db.query(
                `
                UPDATE transaction_pins

                SET
                    failed_attempts = ?,
                    status = 'BLOCKED'

                WHERE user_id = ?
                `,
                [
                    failedAttempts,
                    userId
                ]
            );


            throw new Error(
                "PIN_BLOCKED"
            );
        }


        /*
         * Update failed attempts
         */

        await db.query(
            `
            UPDATE transaction_pins

            SET
                failed_attempts = ?

            WHERE user_id = ?
            `,
            [
                failedAttempts,
                userId
            ]
        );


        throw new Error(
            "INVALID_TRANSACTION_PIN"
        );
    }


    /*
     * 7. Reset failed attempts
     */

    await db.query(
        `
        UPDATE transaction_pins

        SET
            failed_attempts = 0

        WHERE user_id = ?
        `,
        [userId]
    );


    /*
     * 8. Verification successful
     */

    return {
        verified: true
    };
}

export async function changeTransactionPin(
    userId: number,
    currentPin: string,
    newPin: string
) {
    if (!/^\d{6}$/.test(currentPin)) {
        throw new Error("INVALID_CURRENT_PIN");
    }

    if (!/^\d{6}$/.test(newPin)) {
        throw new Error("INVALID_NEW_PIN");
    }

    if (currentPin === newPin) {
        throw new Error("SAME_PIN");
    }

    const [rows] = await db.query(
        `
        SELECT
            id,
            pin_hash,
            status
        FROM transaction_pins
        WHERE user_id = ?
        LIMIT 1
        `,
        [userId]
    );

    const pins = rows as any[];

    if (pins.length === 0) {
        throw new Error("PIN_NOT_SET");
    }

    const pinRecord = pins[0];

    if (pinRecord.status !== "ACTIVE") {
        throw new Error("PIN_BLOCKED");
    }

    const currentPinValid =
        await bcrypt.compare(
            currentPin,
            pinRecord.pin_hash
        );

    if (!currentPinValid) {
        throw new Error("INVALID_CURRENT_PIN");
    }

    const newPinHash =
        await bcrypt.hash(newPin, 10);

    await db.query(
        `
        UPDATE transaction_pins
        SET
            pin_hash = ?,
            failed_attempts = 0,
            status = 'ACTIVE'
        WHERE user_id = ?
        `,
        [
            newPinHash,
            userId
        ]
    );

    return {
        changed: true,
        status: "ACTIVE"
    };
}