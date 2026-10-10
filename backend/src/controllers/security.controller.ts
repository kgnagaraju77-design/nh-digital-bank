import { Request, Response } from "express";

import {
    getLoginHistory,
    getUserSessions,
    revokeUserSession
} from "../services/security.service";


interface AuthRequest extends Request {
    user?: {
        userId: number;
        customerNumber?: string;
        role?: string;
    };
}


/*
 * ============================================================
 * GET LOGIN HISTORY
 *
 * GET /api/security/login-history
 * ============================================================
 */

export async function loginHistory(
    req: AuthRequest,
    res: Response
) {

    try {

        /*
         * 1. Authentication check
         */

        if (!req.user) {

            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }


        /*
         * 2. Pagination
         */

        const limit =
            Number(req.query.limit || 20);

        const offset =
            Number(req.query.offset || 0);


        /*
         * 3. Validate pagination
         */

        if (
            !Number.isInteger(limit) ||
            limit <= 0 ||
            limit > 100
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Limit must be between 1 and 100"
            });
        }


        if (
            !Number.isInteger(offset) ||
            offset < 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Offset must be 0 or greater"
            });
        }


        /*
         * 4. Get login history
         */

        const history =
            await getLoginHistory(
                req.user.userId,
                limit,
                offset
            );


        /*
         * 5. Response
         */

        return res.status(200).json({

            success: true,

            message:
                "Login history retrieved successfully",

            data: {

                records: history,

                pagination: {
                    limit,
                    offset,
                    count: history.length
                }
            }

        });

    } catch (error: any) {

        console.error(
            "Login history error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to retrieve login history"

        });
    }
}


/*
 * ============================================================
 * GET ACTIVE SESSIONS
 *
 * GET /api/security/sessions
 * ============================================================
 */

export async function sessions(
    req: AuthRequest,
    res: Response
) {

    try {

        /*
         * 1. Authentication check
         */

        if (!req.user) {

            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }


        /*
         * 2. Get active sessions
         */

        const userSessions =
            await getUserSessions(
                req.user.userId
            );


        /*
         * 3. Response
         */

        return res.status(200).json({

            success: true,

            message:
                "Active sessions retrieved successfully",

            data: {

                sessions:
                    userSessions,

                count:
                    userSessions.length
            }

        });

    } catch (error: any) {

        console.error(
            "Get sessions error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to retrieve sessions"

        });
    }
}


/*
 * ============================================================
 * REVOKE SESSION
 *
 * DELETE /api/security/sessions/:sessionId
 * ============================================================
 */

export async function revokeSession(
    req: AuthRequest,
    res: Response
) {

    try {

        /*
         * 1. Authentication check
         */

        if (!req.user) {

            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }


        /*
         * 2. Get session ID
         */

        const sessionId =
            Number(req.params.sessionId);


        /*
         * 3. Validate session ID
         */

        if (
            !Number.isInteger(sessionId) ||
            sessionId <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid session ID"

            });
        }


        /*
         * 4. Revoke session
         */

        const result =
            await revokeUserSession(
                req.user.userId,
                sessionId
            );


        /*
         * 5. Response
         */

        return res.status(200).json({

            success: true,

            message:
                "Session revoked successfully",

            data: result

        });

    } catch (error: any) {

        console.error(
            "Revoke session error:",
            error
        );


        /*
         * Session not found
         */

        if (
            error.message ===
            "SESSION_NOT_FOUND"
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "Session not found"

            });
        }


        /*
         * Already revoked
         */

        if (
            error.message ===
            "SESSION_ALREADY_REVOKED"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Session has already been revoked"

            });
        }


        /*
         * Unexpected error
         */

        return res.status(500).json({

            success: false,

            message:
                "Failed to revoke session"

        });
    }
}