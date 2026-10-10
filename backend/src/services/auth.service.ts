import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { db } from "../config/database";
import {
    createNotification
} from "./notification.service";
import {
    createAuditLog
} from "./audit.service";

interface RegisterUser {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
}


/*
 * ============================================================
 * GENERATE REFRESH TOKEN
 * ============================================================
 */

function generateRefreshToken(): string {

    return crypto
        .randomBytes(64)
        .toString("hex");
}


/*
 * ============================================================
 * REGISTER USER
 * ============================================================
 */

export async function registerUser(
    user: RegisterUser
) {

    /*
     * 1. Check duplicate email / phone
     */

    const [existingUsers] =
        await db.query(
            `
            SELECT id
            FROM users
            WHERE email = ?
               OR phone = ?
            `,
            [
                user.email,
                user.phone
            ]
        );


    const users =
        existingUsers as any[];


    if (users.length > 0) {

        throw new Error(
            "Email or phone number already registered"
        );
    }


    /*
     * 2. Hash password
     */

    const passwordHash =
        await bcrypt.hash(
            user.password,
            12
        );


    /*
     * 3. Generate customer number
     */

    const customerNumber =
        "CUS" +
        Date.now()
            .toString()
            .slice(-10);


    /*
     * 4. Insert user
     */

    const [result] =
        await db.query(
            `
            INSERT INTO users
            (
                customer_number,
                first_name,
                last_name,
                email,
                phone,
                password_hash
            )

            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
                customerNumber,
                user.firstName,
                user.lastName,
                user.email,
                user.phone,
                passwordHash
            ]
        );


    const insertResult =
        result as any;


    /*
     * 5. Return user
     */

    return {

        id:
            insertResult.insertId,

        customerNumber,

        firstName:
            user.firstName,

        lastName:
            user.lastName,

        email:
            user.email,

        phone:
            user.phone
    };
}

/*
 * ============================================================
 * RECORD LOGIN HISTORY
 * ============================================================
 */

async function recordLoginHistory(
    userId: number,
    loginStatus: "SUCCESS" | "FAILED",
    ipAddress: string | null = null,
    userAgent: string | null = null
) {

    await db.query(
        `
        INSERT INTO login_history
        (
            user_id,
            ip_address,
            user_agent,
            login_status
        )
        VALUES (?, ?, ?, ?)
        `,
        [
            userId,
            ipAddress,
            userAgent,
            loginStatus
        ]
    );
}


/*
 * ============================================================
 * CREATE USER SESSION
 * ============================================================
 */

async function createUserSession(
    userId: number,
    refreshTokenId: number,
    ipAddress: string | null = null,
    userAgent: string | null = null
) {

    const expiresAt =
        new Date(
            Date.now() +
            7 * 24 * 60 * 60 * 1000
        );


    const [result] =
        await db.query(
            `
            INSERT INTO user_sessions
            (
                user_id,
                refresh_token_id,
                ip_address,
                user_agent,
                expires_at
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                userId,
                refreshTokenId,
                ipAddress,
                userAgent,
                expiresAt
            ]
        );


    const insertResult =
        result as any;


    return {
        sessionId:
            insertResult.insertId,

        expiresAt
    };
}
/*
 * ============================================================
 * GET ACTIVE SESSIONS
 *
 * Returns all active sessions for the logged-in user.
 * ============================================================
 */

export async function getActiveSessions(
    userId: number
) {

    const [rows] =
        await db.query(
            `
            SELECT
                id,
                ip_address,
                user_agent,
                created_at,
                expires_at

            FROM user_sessions

            WHERE user_id = ?

              AND revoked_at IS NULL

              AND expires_at > CURRENT_TIMESTAMP

            ORDER BY created_at DESC
            `,
            [
                userId
            ]
        );


    const sessions =
        rows as any[];


    return sessions.map(
        (session) => ({

            id:
                session.id,

            ipAddress:
                session.ip_address,

            userAgent:
                session.user_agent,

            createdAt:
                session.created_at,

            expiresAt:
                session.expires_at

        })
    );
    
}

/*
 * ============================================================
 * LOGIN USER
 * ============================================================
 */
export async function loginUser(
    email: string,
    password: string,
    ipAddress: string | null = null,
    userAgent: string | null = null
) {

    /*
     * 1. Find user
     */

    const [rows] =
        await db.query(
            `
            SELECT
                id,
                customer_number,
                first_name,
                last_name,
                email,
                phone,
                password_hash,
                role,
                status,
                failed_login_attempts

            FROM users

            WHERE email = ?

            LIMIT 1
            `,
            [email]
        );


    const users =
        rows as any[];


    /*
     * 2. User not found
     */

    if (users.length === 0) {

        /*
         * We cannot store the login against
         * a user because the user doesn't exist.
         */

        throw new Error(
            "Invalid email or password"
        );
    }


    const user =
        users[0];


    /*
     * 3. Check locked account
     */

    if (
    user.status === "LOCKED"
) {

    throw new Error(
        "Your account is locked. Please contact customer support."
    );
}


    /*
     * 4. Check inactive account
     */

    if (
        user.status === "INACTIVE"
    ) {

        throw new Error(
            "Your account is inactive."
        );
    }


    /*
     * 5. Compare password
     */

    const passwordValid =
        await bcrypt.compare(
            password,
            user.password_hash
        );


    /*
     * 6. Wrong password
     */

    if (!passwordValid) {

    await recordLoginHistory(
        user.id,
        "FAILED",
        ipAddress,
        userAgent
    );

    await createAuditLog(
        user.id,
        "LOGIN_FAILED",
        "Invalid email or password",
        ipAddress,
        userAgent
    );

 await createNotification(
        user.id,
        "Login Failed",
        "An invalid password was entered.",
        "LOGIN"
    );

        const newFailedAttempts =
            Number(
                user.failed_login_attempts || 0
            ) + 1;


        /*
         * Lock after 5 failed attempts
         */

        if (
            newFailedAttempts >= 5
        ) {

            await db.query(
                `
                UPDATE users

                SET
                    failed_login_attempts = ?,
                    status = 'LOCKED'

                WHERE id = ?
                `,
                [
                    newFailedAttempts,
                    user.id
                ]
            );


            throw new Error(
                "Account locked after multiple failed login attempts."
            );
        }


        /*
         * Update failed attempts
         */

        await db.query(
            `
            UPDATE users

            SET
                failed_login_attempts = ?

            WHERE id = ?
            `,
            [
                newFailedAttempts,
                user.id
            ]
        );


        throw new Error(
            "Invalid email or password"
        );
    }


    /*
     * 7. Successful login
     */

    await db.query(
        `
        UPDATE users

        SET
            failed_login_attempts = 0,
            last_login_at = CURRENT_TIMESTAMP

        WHERE id = ?
        `,
        [user.id]
    );

    await createNotification(
    user.id,
    "Login Successful",
    "You logged in successfully.",
    "LOGIN"
);
await createAuditLog(
    user.id,
    "LOGIN",
    "User logged in successfully",
    ipAddress,
    userAgent
);

    /*
     * 8. JWT secret
     */

    const secret =
        process.env.JWT_SECRET;


    if (!secret) {

        throw new Error(
            "JWT_SECRET is not configured"
        );
    }


    /*
     * 9. Generate access token
     */

    const token =
        jwt.sign(
            {
                userId:
                    user.id,

                customerNumber:
                    user.customer_number,

                role:
                    user.role
            },

            secret,

            {
                expiresIn: "1h"
            }
        );


    /*
     * 10. Create refresh token
     */

    const refreshToken =
        await createRefreshToken(
            user.id
        );


    /*
     * 11. Record successful login
     */

    await recordLoginHistory(
        user.id,
        "SUCCESS",
        ipAddress,
        userAgent
    );


    /*
     * 12. Create user session
     */

    await createUserSession(
        user.id,
        refreshToken.id,
        ipAddress,
        userAgent
    );


    /*
     * 13. Return login response
     */

    return {

        token,

        refreshToken:
            refreshToken.refreshToken,

        refreshTokenExpiresAt:
            refreshToken.expiresAt,

        user: {

            id:
                user.id,

            customerNumber:
                user.customer_number,

            firstName:
                user.first_name,

            lastName:
                user.last_name,

            email:
                user.email,

            role:
                user.role
        }
    };
}

/*
 * ============================================================
 * CHANGE USER PASSWORD
 * ============================================================
 */

export async function changeUserPassword(
    userId: number,
    currentPassword: string,
    newPassword: string
) {

    /*
     * 1. Get current password
     */

    const [rows] =
        await db.query(
            `
            SELECT
                id,
                password_hash,
                status

            FROM users

            WHERE id = ?

            LIMIT 1
            `,
            [
                userId
            ]
        );


    const users =
        rows as any[];


    if (users.length === 0) {

        throw new Error(
            "USER_NOT_FOUND"
        );
    }


    const user =
        users[0];


    /*
     * 2. Check account status
     */

    if (
        user.status === "LOCKED"
    ) {

        throw new Error(
            "ACCOUNT_LOCKED"
        );
    }


    if (
        user.status === "INACTIVE"
    ) {

        throw new Error(
            "ACCOUNT_INACTIVE"
        );
    }


    /*
     * 3. Verify current password
     */

    const passwordValid =
        await bcrypt.compare(
            currentPassword,
            user.password_hash
        );


    if (!passwordValid) {

        throw new Error(
            "INVALID_CURRENT_PASSWORD"
        );
    }


    /*
     * 4. Prevent same password
     */

    const samePassword =
        await bcrypt.compare(
            newPassword,
            user.password_hash
        );


    if (samePassword) {

        throw new Error(
            "SAME_PASSWORD"
        );
    }


    /*
     * 5. Hash new password
     */

    const newPasswordHash =
        await bcrypt.hash(
            newPassword,
            12
        );


    /*
     * 6. Update password
     */

    await db.query(
        `
        UPDATE users

        SET
            password_hash = ?,
            updated_at = CURRENT_TIMESTAMP

        WHERE id = ?
        `,
        [
            newPasswordHash,
            userId
        ]
    );


    return {
        passwordChanged: true
    };
}


/*
 * ============================================================
 * FORGOT PASSWORD
 * ============================================================
 */

export async function forgotUserPassword(
    email: string
) {

    /*
     * 1. Find user
     */

    const [rows] =
        await db.query(
            `
            SELECT
                id,
                email,
                status

            FROM users

            WHERE email = ?

            LIMIT 1
            `,
            [
                email
            ]
        );


    const users =
        rows as any[];


    /*
     * Do not reveal whether
     * email exists.
     */

    if (users.length === 0) {

        return {
            resetToken: null
        };
    }


    const user =
        users[0];


    /*
     * Don't generate reset token
     * for locked/inactive accounts.
     */

    if (
        user.status === "LOCKED" ||
        user.status === "INACTIVE"
    ) {

        return {
            resetToken: null
        };
    }


    /*
     * 2. Generate reset token
     */

    const resetToken =
        crypto
            .randomBytes(32)
            .toString("hex");


    /*
     * 3. Hash reset token
     */

    const hashedToken =
        crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");


    /*
     * 4. Expire after 15 minutes
     */

    const expiresAt =
        new Date(
            Date.now() +
            15 * 60 * 1000
        );


    /*
     * 5. Store hashed token
     */

    await db.query(
        `
        UPDATE users

        SET
            password_reset_token = ?,
            password_reset_expires_at = ?

        WHERE id = ?
        `,
        [
            hashedToken,
            expiresAt,
            user.id
        ]
    );


    /*
     * Development:
     * return token for Postman testing.
     *
     * Production:
     * send token through email/SMS.
     */

    return {
        resetToken
    };
}


/*
 * ============================================================
 * RESET PASSWORD
 * ============================================================
 */

export async function resetUserPassword(
    resetToken: string,
    newPassword: string
) {

    /*
     * 1. Hash incoming token
     */

    const hashedToken =
        crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");


    /*
     * 2. Find user
     */

    const [rows] =
        await db.query(
            `
            SELECT
                id,
                password_hash,
                password_reset_expires_at,
                status

            FROM users

            WHERE password_reset_token = ?

            LIMIT 1
            `,
            [
                hashedToken
            ]
        );


    const users =
        rows as any[];


    if (users.length === 0) {

        throw new Error(
            "INVALID_RESET_TOKEN"
        );
    }


    const user =
        users[0];


    /*
     * 3. Check expiration
     */

    if (
        !user.password_reset_expires_at ||
        new Date(
            user.password_reset_expires_at
        ).getTime() <= Date.now()
    ) {

        await db.query(
            `
            UPDATE users

            SET
                password_reset_token = NULL,
                password_reset_expires_at = NULL

            WHERE id = ?
            `,
            [
                user.id
            ]
        );


        throw new Error(
            "RESET_TOKEN_EXPIRED"
        );
    }


    /*
     * 4. Check account status
     */

    if (
        user.status === "LOCKED"
    ) {

        throw new Error(
            "ACCOUNT_LOCKED"
        );
    }


    if (
        user.status === "INACTIVE"
    ) {

        throw new Error(
            "ACCOUNT_INACTIVE"
        );
    }


    /*
     * 5. Prevent same password
     */

    const samePassword =
        await bcrypt.compare(
            newPassword,
            user.password_hash
        );


    if (samePassword) {

        throw new Error(
            "SAME_PASSWORD"
        );
    }


    /*
     * 6. Hash new password
     */

    const newPasswordHash =
        await bcrypt.hash(
            newPassword,
            12
        );


    /*
     * 7. Update password
     * and invalidate reset token
     */

    await db.query(
        `
        UPDATE users

        SET
            password_hash = ?,
            password_reset_token = NULL,
            password_reset_expires_at = NULL,
            updated_at = CURRENT_TIMESTAMP

        WHERE id = ?
        `,
        [
            newPasswordHash,
            user.id
        ]
    );


    /*
     * 8. Return result
     */

    return {

        userId:
            user.id,

        passwordReset:
            true
    };
}


/*
 * ============================================================
 * CREATE REFRESH TOKEN
 * ============================================================
 */

export async function createRefreshToken(
    userId: number
) {

    /*
     * 1. Generate refresh token
     */

    const refreshToken =
        generateRefreshToken();


    /*
     * 2. Hash token
     *
     * Never store the actual refresh token
     * in the database.
     */

    const tokenHash =
        crypto
            .createHash("sha256")
            .update(refreshToken)
            .digest("hex");


    /*
     * 3. Expire after 7 days
     */

    const expiresAt =
        new Date(
            Date.now() +
            7 * 24 * 60 * 60 * 1000
        );


    /*
     * 4. Save refresh token ONCE
     */

    const [result] =
        await db.query(
            `
            INSERT INTO refresh_tokens
            (
                user_id,
                token_hash,
                expires_at
            )

            VALUES (?, ?, ?)
            `,
            [
                userId,
                tokenHash,
                expiresAt
            ]
        );


    /*
     * 5. Get inserted database ID
     */

    const insertResult =
        result as any;


    /*
     * 6. Return refresh token
     *
     * The client receives the actual token.
     * The database stores only the hash.
     */

    return {

        id:
            insertResult.insertId,

        refreshToken,

        expiresAt
    };
}

/*
 * ============================================================
 * REFRESH ACCESS TOKEN
 * ============================================================
 */

export async function refreshAccessToken(
    refreshToken: string
) {

    /*
     * 1. Hash supplied token
     */

    const tokenHash =
        crypto
            .createHash("sha256")
            .update(refreshToken)
            .digest("hex");


    /*
     * 2. Find token and user
     */

    const [rows] =
        await db.query(
            `
            SELECT

                rt.id AS refresh_token_id,

                rt.user_id,

                rt.expires_at,

                rt.revoked_at,

                u.customer_number,

                u.role,

                u.status

            FROM refresh_tokens rt

            INNER JOIN users u
                ON rt.user_id = u.id

            WHERE rt.token_hash = ?

            LIMIT 1
            `,
            [
                tokenHash
            ]
        );


    const tokens =
        rows as any[];


    /*
     * 3. Token doesn't exist
     */

    if (
        tokens.length === 0
    ) {

        throw new Error(
            "INVALID_REFRESH_TOKEN"
        );
    }


    const token =
        tokens[0];


    /*
     * 4. Token revoked
     */

    if (
        token.revoked_at !== null
    ) {

        throw new Error(
            "REFRESH_TOKEN_REVOKED"
        );
    }


    /*
     * 5. Token expired
     */

    if (
        !token.expires_at ||
        new Date(
            token.expires_at
        ).getTime() <= Date.now()
    ) {

        throw new Error(
            "REFRESH_TOKEN_EXPIRED"
        );
    }


    /*
     * 6. Check account status
     */

    if (
        token.status === "LOCKED"
    ) {

        throw new Error(
            "ACCOUNT_LOCKED"
        );
    }


    if (
        token.status === "INACTIVE"
    ) {

        throw new Error(
            "ACCOUNT_INACTIVE"
        );
    }


    /*
     * 7. JWT secret
     */

    const secret =
        process.env.JWT_SECRET;


    if (!secret) {

        throw new Error(
            "JWT_SECRET is not configured"
        );
    }


    /*
     * 8. Generate new access token
     */

    const accessToken =
        jwt.sign(
            {
                userId:
                    token.user_id,

                customerNumber:
                    token.customer_number,

                role:
                    token.role
            },

            secret,

            {
                expiresIn: "1h"
            }
        );


    /*
     * 9. Return new access token
     */

    return {

        accessToken
    };
}
/*
 * ============================================================
 * LOGOUT USER
 *
 * Revoke the refresh token
 *
 * POST /api/auth/logout
 * ============================================================
 */

export async function logoutUser(
    refreshToken: string,
    ipAddress: string | null = null,
    userAgent: string | null = null
) {

    /*
     * 1. Validate refresh token
     */

    if (
        !refreshToken ||
        refreshToken.trim() === ""
    ) {

        throw new Error(
            "REFRESH_TOKEN_REQUIRED"
        );
    }


    /*
     * 2. Hash refresh token
     */

    const tokenHash =
        crypto
            .createHash("sha256")
            .update(refreshToken.trim())
            .digest("hex");


    /*
     * 3. Find refresh token
     *
     * Also get user_id so that we can
     * create the audit log.
     */

    const [rows] =
        await db.query(
            `
            SELECT
                id,
                user_id,
                revoked_at

            FROM refresh_tokens

            WHERE token_hash = ?

            LIMIT 1
            `,
            [
                tokenHash
            ]
        );


    const tokens =
        rows as any[];


    /*
     * 4. Token doesn't exist
     */

    if (
        tokens.length === 0
    ) {

        throw new Error(
            "INVALID_REFRESH_TOKEN"
        );
    }


    const token =
        tokens[0];


    /*
     * 5. Already revoked
     */

    if (
        token.revoked_at !== null
    ) {

        throw new Error(
            "REFRESH_TOKEN_REVOKED"
        );
    }


    /*
     * 6. Revoke refresh token
     */

    await db.query(
        `
        UPDATE refresh_tokens

        SET
            revoked_at = CURRENT_TIMESTAMP

        WHERE id = ?
        `,
        [
            token.id
        ]
    );


    /*
     * 7. Revoke related session
     */

    await db.query(
        `
        UPDATE user_sessions

        SET
            revoked_at = CURRENT_TIMESTAMP

        WHERE refresh_token_id = ?
        `,
        [
            token.id
        ]
    );


    /*
     * 8. Create audit log
     */

    await createAuditLog(
        token.user_id,
        "LOGOUT",
        "User logged out successfully",
        ipAddress,
        userAgent
    );


    /*
     * 9. Return result
     */

    return {

        loggedOut: true

    };
}

/*
 * ============================================================
 * REVOKE ALL SESSIONS
 *
 * POST /api/auth/sessions/revoke-all
 * ============================================================
 */

export async function revokeAllSessions(
    userId: number,
    ipAddress: string | null = null,
    userAgent: string | null = null
) {

    /*
     * 1. Find all active sessions
     */

    const [rows] =
        await db.query(
            `
            SELECT
                id,
                refresh_token_id

            FROM user_sessions

            WHERE user_id = ?
              AND revoked_at IS NULL
              AND expires_at > CURRENT_TIMESTAMP
            `,
            [
                userId
            ]
        );


    const sessions =
        rows as any[];


    /*
     * 2. No active sessions
     */

    if (sessions.length === 0) {

        return {
            revokedCount: 0
        };
    }


    /*
     * 3. Revoke all active sessions
     */

    await db.query(
        `
        UPDATE user_sessions

        SET
            revoked_at = CURRENT_TIMESTAMP

        WHERE user_id = ?
          AND revoked_at IS NULL
          AND expires_at > CURRENT_TIMESTAMP
        `,
        [
            userId
        ]
    );


    /*
     * 4. Revoke related refresh tokens
     */

    const refreshTokenIds =
        sessions
            .map(
                session =>
                    session.refresh_token_id
            )
            .filter(
                id => id !== null
            );


    if (
        refreshTokenIds.length > 0
    ) {

        const placeholders =
            refreshTokenIds
                .map(() => "?")
                .join(",");


        await db.query(
            `
            UPDATE refresh_tokens

            SET
                revoked_at = CURRENT_TIMESTAMP

            WHERE user_id = ?

              AND id IN (${placeholders})

              AND revoked_at IS NULL
            `,
            [
                userId,
                ...refreshTokenIds
            ]
        );
    }

}