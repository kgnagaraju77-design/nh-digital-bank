import { Router } from "express";

import {
    getUserNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead
} from "../controllers/notification.controller";

import {
    authenticateToken
} from "../middleware/auth.middleware";


const router = Router();


/*
 * ============================================================
 * GET ALL NOTIFICATIONS
 *
 * GET /api/notifications
 *
 * Optional:
 * ?page=1
 * ?limit=20
 * ?unreadOnly=true
 * ============================================================
 */

router.get(
    "/",
    authenticateToken,
    getUserNotifications
);


/*
 * ============================================================
 * GET UNREAD NOTIFICATION COUNT
 *
 * GET /api/notifications/unread-count
 * ============================================================
 */

router.get(
    "/unread-count",
    authenticateToken,
    getUnreadCount
);


/*
 * ============================================================
 * MARK ALL NOTIFICATIONS AS READ
 *
 * PATCH /api/notifications/read-all
 * ============================================================
 */

router.patch(
    "/read-all",
    authenticateToken,
    markAllAsRead
);


/*
 * ============================================================
 * MARK SINGLE NOTIFICATION AS READ
 *
 * PATCH /api/notifications/:notificationId/read
 * ============================================================
 */

router.patch(
    "/:notificationId/read",
    authenticateToken,
    markAsRead
);


export default router;