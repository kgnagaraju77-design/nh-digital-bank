import { Request, Response } from "express";

import {
    AuthRequest
} from "../middleware/auth.middleware";



import {
    registerSchema,
    loginSchema
} from "../validators/auth.validator";


import {
    registerUser,
    loginUser,
    changeUserPassword,
    forgotUserPassword,
    resetUserPassword,
     refreshAccessToken,
       logoutUser,
       getActiveSessions,
       revokeAllSessions
       
} from "../services/auth.service";


/*
 * ============================================================
 * REGISTER
 *
 * POST /api/auth/register
 * ============================================================
 */

export async function register(
    req: Request,
    res: Response
) {

    try {

        const validation =
            registerSchema.safeParse(req.body);


        if (!validation.success) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid registration details",

                errors:
                    validation.error.flatten()

            });
        }


        const user =
            await registerUser(
                validation.data
            );


        return res.status(201).json({

            success: true,

            message:
                "Customer registered successfully",

            data: user

        });

    } catch (error: any) {

        console.error(error);


        return res.status(409).json({

            success: false,

            message:
                error.message ||
                "Registration failed"

        });
    }
}



/*
 * ============================================================
 * LOGIN
 *
 * POST /api/auth/login
 * ============================================================
 */

export async function login(
    req: Request,
    res: Response
) {

    try {

        const validation =
            loginSchema.safeParse(req.body);


        if (!validation.success) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid login details",

                errors:
                    validation.error.flatten()

            });
        }


        const {
            email,
            password
        } = validation.data;

const ipAddress =
    req.ip || null;

const userAgent =
    req.headers["user-agent"] || null;

        const result =
    await loginUser(
        email,
        password,
        ipAddress,
        typeof userAgent === "string"
            ? userAgent
            : null
    );


        return res.status(200).json({

            success: true,

            message:
                "Login successful",

            data: result

        });

    } catch (error: any) {

        console.error(error);


        return res.status(401).json({

            success: false,

            message:
                error.message ||
                "Login failed"

        });
    }
}



/*
 * ============================================================
 * CHANGE PASSWORD
 *
 * POST /api/auth/change-password
 * ============================================================
 */

export async function changePassword(
    req: AuthRequest,
    res: Response
) {

    try {

        /*
         * 1. Check authentication
         */

        if (!req.user) {

            return res.status(401).json({

                success: false,

                message:
                    "Unauthorized"

            });
        }


        /*
         * 2. Get request body
         */

        const {
            currentPassword,
            newPassword
        } = req.body;


        /*
         * 3. Validate required fields
         */

        if (
            typeof currentPassword !== "string" ||
            typeof newPassword !== "string"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Current password and new password are required"

            });
        }


        /*
         * 4. Validate empty values
         */

        if (
            currentPassword.trim() === "" ||
            newPassword.trim() === ""
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Current password and new password are required"

            });
        }


        /*
         * 5. Validate new password length
         */

        if (
            newPassword.length < 8
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "New password must be at least 8 characters"

            });
        }


        /*
         * 6. Change password
         */

        await changeUserPassword(

            req.user.userId,

            currentPassword,

            newPassword

        );


        /*
         * 7. Successful response
         */

        return res.status(200).json({

            success: true,

            message:
                "Password changed successfully"

        });

    } catch (error: any) {

        console.error(
            "Change password error:",
            error
        );


        /*
         * 8. User not found
         */

        if (
            error.message ===
            "USER_NOT_FOUND"
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "User not found"

            });
        }


        /*
         * 9. Wrong current password
         */

        if (
            error.message ===
            "INVALID_CURRENT_PASSWORD"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Current password is incorrect"

            });
        }


        /*
         * 10. Same password
         */

        if (
            error.message ===
            "SAME_PASSWORD"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "New password must be different from current password"

            });
        }


        /*
         * 11. Locked account
         */

        if (
            error.message ===
            "ACCOUNT_LOCKED"
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "Your account is locked"

            });
        }


        /*
         * 12. Inactive account
         */

        if (
            error.message ===
            "ACCOUNT_INACTIVE"
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "Your account is inactive"

            });
        }


        /*
         * 13. Unexpected error
         */

        return res.status(500).json({

            success: false,

            message:
                "Failed to change password"

        });
    }
}

/*
 * ============================================================
 * FORGOT PASSWORD
 *
 * POST /api/auth/forgot-password
 * ============================================================
 */

export async function forgotPassword(
    req: Request,
    res: Response
) {

    try {

        /*
         * 1. Get email
         */

        const {
            email
        } = req.body;


        /*
         * 2. Validate email
         */

        if (
            typeof email !== "string" ||
            email.trim() === ""
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Email is required"

            });
        }


        /*
         * 3. Generate reset token
         */

        const result =
            await forgotUserPassword(
                email.trim().toLowerCase()
            );


        /*
         * 4. Always return generic
         * response.
         *
         * This prevents email
         * enumeration.
         */

        const response: any = {

            success: true,

            message:
                "If the email is registered, a password reset token has been generated"
        };


        /*
         * Development only:
         * return token so Postman
         * can test the flow.
         */

        if (
            process.env.NODE_ENV !== "production" &&
            result.resetToken
        ) {

            response.data = {
                resetToken:
                    result.resetToken,

                expiresIn:
                    "15 minutes"
            };
        }


        return res.status(200).json(
            response
        );

    } catch (error: any) {

        console.error(
            "Forgot password error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to process forgot password request"

        });
    }
}

/*
 * ============================================================
 * RESET PASSWORD
 *
 * POST /api/auth/reset-password
 * ============================================================
 */

export async function resetPassword(
    req: Request,
    res: Response
) {

    try {

        const {
            resetToken,
            newPassword
        } = req.body;


        /*
         * Validate fields
         */

        if (
            typeof resetToken !== "string" ||
            typeof newPassword !== "string" ||
            resetToken.trim() === "" ||
            newPassword.trim() === ""
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Reset token and new password are required"

            });
        }


        /*
         * Validate password length
         */

        if (
            newPassword.length < 8
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "New password must be at least 8 characters"

            });
        }


        /*
         * Reset password
         */

        await resetUserPassword(
            resetToken.trim(),
            newPassword
        );


        /*
         * Success
         */

        return res.status(200).json({

            success: true,

            message:
                "Password reset successfully"

        });

    } catch (error: any) {

        console.error(
            "Reset password error:",
            error
        );


        if (
            error.message ===
            "INVALID_RESET_TOKEN"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid password reset token"

            });
        }


        if (
            error.message ===
            "RESET_TOKEN_EXPIRED"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Password reset token has expired"

            });
        }


        if (
            error.message ===
            "SAME_PASSWORD"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "New password must be different from current password"

            });
        }


        if (
            error.message ===
            "ACCOUNT_LOCKED"
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "Your account is locked"

            });
        }


        if (
            error.message ===
            "ACCOUNT_INACTIVE"
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "Your account is inactive"

            });
        }


        return res.status(500).json({

            success: false,

            message:
                "Failed to reset password"

        });
    }
}

/*
 * ============================================================
 * REFRESH ACCESS TOKEN
 *
 * POST /api/auth/refresh-token
 * ============================================================
 */

export async function refreshToken(
    req: Request,
    res: Response
) {

    try {

        const {
            refreshToken
        } = req.body;


        /*
         * Validate refresh token
         */

        if (
            typeof refreshToken !== "string" ||
            refreshToken.trim() === ""
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Refresh token is required"

            });
        }


        /*
         * Generate new access token
         */

        const result =
            await refreshAccessToken(
                refreshToken.trim()
            );


        return res.status(200).json({

            success: true,

            message:
                "Access token refreshed successfully",

            data: result

        });

    } catch (error: any) {

        console.error(
            "Refresh token error:",
            error
        );


        if (
            error.message ===
            "INVALID_REFRESH_TOKEN"
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid refresh token"

            });
        }


        if (
            error.message ===
            "REFRESH_TOKEN_REVOKED"
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "Refresh token has been revoked"

            });
        }


        if (
            error.message ===
            "REFRESH_TOKEN_EXPIRED"
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "Refresh token has expired"

            });
        }


        if (
            error.message ===
            "ACCOUNT_LOCKED"
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "Your account is locked"

            });
        }


        if (
            error.message ===
            "ACCOUNT_INACTIVE"
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "Your account is inactive"

            });
        }


        return res.status(500).json({

            success: false,

            message:
                "Failed to refresh access token"

        });
    }
}


/*
 * ============================================================
 * LOGOUT
 *
 * POST /api/auth/logout
 * ============================================================
 */

export async function logout(
    req: Request,
    res: Response
) {

    try {

        /*
         * 1. Get refresh token
         */

        const {
            refreshToken
        } = req.body;


        /*
         * 2. Validate refresh token
         */

        if (
            typeof refreshToken !== "string" ||
            refreshToken.trim() === ""
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Refresh token is required"

            });
        }


        /*
         * 3. Get request information
         */

        const ipAddress =
            req.ip || null;

        const userAgent =
            req.headers["user-agent"] || null;


        /*
         * 4. Logout user
         */

        await logoutUser(

            refreshToken,

            ipAddress,

            typeof userAgent === "string"
                ? userAgent
                : null

        );


        /*
         * 5. Successful logout
         */

        return res.status(200).json({

            success: true,

            message:
                "Logged out successfully"

        });

    } catch (error: any) {

        console.error(
            "Logout error:",
            error
        );


        /*
         * Refresh token required
         */

        if (
            error.message ===
            "REFRESH_TOKEN_REQUIRED"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Refresh token is required"

            });
        }


        /*
         * Invalid refresh token
         */

        if (
            error.message ===
            "INVALID_REFRESH_TOKEN"
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid refresh token"

            });
        }


        /*
         * Already revoked
         */

        if (
            error.message ===
            "REFRESH_TOKEN_REVOKED"
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "Refresh token has already been revoked"

            });
        }


        /*
         * Unexpected error
         */

        return res.status(500).json({

            success: false,

            message:
                "Failed to logout"

        });
    }
}
/*
 * ============================================================
 * GET ACTIVE SESSIONS
 *
 * GET /api/auth/sessions
 * ============================================================
 */

export async function getSessions(
    req: AuthRequest,
    res: Response
) {

    try {

        /*
         * Check authentication
         */

        if (!req.user) {

            return res.status(401).json({

                success: false,

                message:
                    "Unauthorized"

            });
        }


        /*
         * Get active sessions
         */

        const sessions =
            await getActiveSessions(
                req.user.userId
            );


        /*
         * Return response
         */

        return res.status(200).json({

            success: true,

            message:
                "Active sessions retrieved successfully",

            data: {

                sessions

            }

        });

    } catch (error: any) {

        console.error(
            "Get active sessions error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to retrieve active sessions"

        });
    }
}



/*
 * ============================================================
 * REVOKE ALL SESSIONS
 *
 * POST /api/auth/sessions/revoke-all
 * ============================================================
 */

export async function revokeAllSessionsController(
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

                message:
                    "Unauthorized"

            });
        }


        /*
         * 2. Request information
         */

        const ipAddress =
            req.ip || null;

        const userAgent =
            req.headers["user-agent"] || null;


        /*
         * 3. Revoke all sessions
         */

        const result =
            await revokeAllSessions(
                req.user.userId,
                ipAddress,
                typeof userAgent === "string"
                    ? userAgent
                    : null
            );


        /*
         * 4. Success response
         */

        return res.status(200).json({

            success: true,

            message:
                "All active sessions revoked successfully",

            data:
                result

        });

    } catch (error: any) {

        console.error(
            "Revoke all sessions error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to revoke all sessions"

        });
    }
}