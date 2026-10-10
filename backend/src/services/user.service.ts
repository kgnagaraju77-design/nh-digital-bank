import { db } from "../config/database";


/*
 * ============================================================
 * GET USER PROFILE
 * ============================================================
 */

export async function getUserProfile(
    userId: number
) {

    const [rows] = await db.query(
        `
        SELECT
            id,
            customer_number,
            first_name,
            last_name,
            email,
            phone,
            role,
            status,
            created_at,
            last_login_at

        FROM users

        WHERE id = ?

        LIMIT 1
        `,
        [userId]
    );

    const users =
        rows as any[];

    if (users.length === 0) {
        throw new Error("USER_NOT_FOUND");
    }

    const user = users[0];

    return {
        id: user.id,
        customerNumber: user.customer_number,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        createdAt: user.created_at,
        lastLoginAt: user.last_login_at
    };
}


/*
 * ============================================================
 * UPDATE USER PROFILE
 * ============================================================
 */

export async function updateUserProfile(
    userId: number,
    firstName: string,
    lastName: string,
    phone: string
) {

    /*
     * Check user
     */

    const [rows] = await db.query(
        `
        SELECT id
        FROM users
        WHERE id = ?
        LIMIT 1
        `,
        [userId]
    );

    const users =
        rows as any[];

    if (users.length === 0) {
        throw new Error("USER_NOT_FOUND");
    }


    /*
     * Check phone belongs to another user
     */

    const [phoneRows] = await db.query(
        `
        SELECT id
        FROM users

        WHERE phone = ?
        AND id != ?

        LIMIT 1
        `,
        [
            phone,
            userId
        ]
    );

    const phoneUsers =
        phoneRows as any[];

    if (phoneUsers.length > 0) {
        throw new Error(
            "PHONE_ALREADY_REGISTERED"
        );
    }


    /*
     * Update profile
     */

    await db.query(
        `
        UPDATE users

        SET
            first_name = ?,
            last_name = ?,
            phone = ?,
            updated_at = CURRENT_TIMESTAMP

        WHERE id = ?
        `,
        [
            firstName,
            lastName,
            phone,
            userId
        ]
    );


    return await getUserProfile(userId);
}