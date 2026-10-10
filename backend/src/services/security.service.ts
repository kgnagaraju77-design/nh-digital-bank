import { db } from "../config/database";


/*
 * ============================================================
 * GET LOGIN HISTORY
 *
 * GET /api/security/login-history
 * ============================================================
 */

export async function getLoginHistory(
    userId: number,
    limit: number = 20,
    offset: number = 0
) {

    const safeLimit =
        Math.min(Math.max(limit, 1), 100);

    const safeOffset =
        Math.max(offset, 0);


    const [rows] =
        await db.query(
            `
            SELECT
                id,
                login_at,
                ip_address,
                user_agent,
                login_status

            FROM login_history

            WHERE user_id = ?

            ORDER BY login_at DESC

            LIMIT ? OFFSET ?
            `,
            [
                userId,
                safeLimit,
                safeOffset
            ]
        );


    const history =
        rows as any[];


    return history.map(
        (item) => ({
            id: item.id,

            loginAt:
                item.login_at,

            ipAddress:
                item.ip_address,

            userAgent:
                item.user_agent,

            loginStatus:
                item.login_status
        })
    );
}


/*
 * ============================================================
 * GET ACTIVE SESSIONS
 *
 * GET /api/security/sessions
 * ============================================================
 */

export async function getUserSessions(
    userId: number
) {

    const [rows] =
        await db.query(
            `
            SELECT
                us.id,
                us.ip_address,
                us.user_agent,
                us.created_at,
                us.last_activity_at,
                us.expires_at,
                us.revoked_at

            FROM user_sessions us

            WHERE us.user_id = ?

            AND us.revoked_at IS NULL

            AND us.expires_at > CURRENT_TIMESTAMP

            ORDER BY us.last_activity_at DESC
            `,
            [
                userId
            ]
        );


    const sessions =
        rows as any[];


    return sessions.map(
        (session) => ({
            id: session.id,

            ipAddress:
                session.ip_address,

            userAgent:
                session.user_agent,

            createdAt:
                session.created_at,

            lastActivityAt:
                session.last_activity_at,

            expiresAt:
                session.expires_at
        })
    );
}


/*
 * ============================================================
 * REVOKE SESSION
 *
 * DELETE /api/security/sessions/:sessionId
 * ============================================================
 */

export async function revokeUserSession(
    userId: number,
    sessionId: number
) {

    /*
     * Check session belongs to user
     */

    const [rows] =
        await db.query(
            `
            SELECT
                id,
                refresh_token_id,
                revoked_at

            FROM user_sessions

            WHERE id = ?

            AND user_id = ?

            LIMIT 1
            `,
            [
                sessionId,
                userId
            ]
        );


    const sessions =
        rows as any[];


    if (sessions.length === 0) {

        throw new Error(
            "SESSION_NOT_FOUND"
        );
    }


    const session =
        sessions[0];


    /*
     * Already revoked
     */

    if (
        session.revoked_at !== null
    ) {

        throw new Error(
            "SESSION_ALREADY_REVOKED"
        );
    }


    /*
     * Revoke session
     */

    await db.query(
        `
        UPDATE user_sessions

        SET
            revoked_at = CURRENT_TIMESTAMP

        WHERE id = ?

        AND user_id = ?
        `,
        [
            sessionId,
            userId
        ]
    );


    /*
     * Revoke associated refresh token
     */

    if (
        session.refresh_token_id
    ) {

        await db.query(
            `
            UPDATE refresh_tokens

            SET
                revoked_at = CURRENT_TIMESTAMP

            WHERE id = ?

            AND revoked_at IS NULL
            `,
            [
                session.refresh_token_id
            ]
        );
    }


    return {
        sessionId,
        revoked: true
    };
}