import { Router } from "express";

import {
    register,
    login,
    changePassword,
    forgotPassword,
    resetPassword,
    refreshToken,
    logout,
    getSessions,
 revokeAllSessionsController,
   
} from "../controllers/auth.controller";

import {
    authenticateToken
} from "../middleware/auth.middleware";


const router = Router();


/*
 * ============================================================
 * REGISTER
 * ============================================================
 */

router.post(
    "/register",
    register
);


/*
 * ============================================================
 * LOGIN
 * ============================================================
 */

router.post(
    "/login",
    login
);


/*
 * ============================================================
 * CHANGE PASSWORD
 * ============================================================
 */

router.post(
    "/change-password",
    authenticateToken,
    changePassword
);


/*
 * ============================================================
 * FORGOT PASSWORD
 * ============================================================
 */

router.post(
    "/forgot-password",
    forgotPassword
);


/*
 * ============================================================
 * RESET PASSWORD
 *
 * POST /api/auth/reset-password
 * ============================================================
 */

router.post(
    "/reset-password",
    resetPassword
);


/*
 * ============================================================
 * REFRESH TOKEN
 *
 * POST /api/auth/refresh-token
 * ============================================================
 */

router.post(
    "/refresh-token",
    refreshToken
);


/*
 * ============================================================
 * LOGOUT
 *
 * POST /api/auth/logout
 * ============================================================
 */

router.post(
    "/logout",
    logout
);


/*
 * ============================================================
 * ACTIVE SESSIONS
 *
 * GET /api/auth/sessions
 * ============================================================
 */

router.get(
    "/sessions",
    authenticateToken,
    getSessions
);

/*
 * ============================================================
 * REVOKE ALL SESSIONS
 *
 * POST /api/auth/sessions/revoke-all
 * ============================================================
 */

router.post(
    "/sessions/revoke-all",
    authenticateToken,
    revokeAllSessionsController
);
export default router;