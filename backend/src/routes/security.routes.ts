import { Router } from "express";

import {
    loginHistory,
    sessions,
    revokeSession
} from "../controllers/security.controller";

import {
    authenticateToken
} from "../middleware/auth.middleware";

import {
    getAuditLogsController
} from "../controllers/audit.controller";


const router = Router();


/*
 * ============================================================
 * LOGIN HISTORY
 *
 * GET /api/security/login-history
 * ============================================================
 */

router.get(
    "/login-history",
    authenticateToken,
    loginHistory
);

router.get(
    "/audit-logs",
    authenticateToken,
    getAuditLogsController
);

/*
 * ============================================================
 * ACTIVE SESSIONS
 *
 * GET /api/security/sessions
 * ============================================================
 */

router.get(
    "/sessions",
    authenticateToken,
    sessions
);


/*
 * ============================================================
 * REVOKE SESSION
 *
 * DELETE /api/security/sessions/:sessionId
 * ============================================================
 */

router.delete(
    "/sessions/:sessionId",
    authenticateToken,
    revokeSession
);


export default router;