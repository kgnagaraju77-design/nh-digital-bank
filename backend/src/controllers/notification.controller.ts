import { Response } from "express";

import {
    AuthRequest
} from "../middleware/auth.middleware";

import {
    getNotifications,
    getUnreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead
} from "../services/notification.service";


/*
 * ============================================================
 * GET NOTIFICATIONS
 *
 * GET /api/notifications
 * ============================================================
 */

export async function getUserNotifications(
    req: AuthRequest,
    res: Response
) {

    try {

        /*
         * 1. Authentication
         */

        if (!req.user) {

            return res.status(401).json({

                success: false,

                message:
                    "Unauthorized"

            });
        }


        /*
         * 2. Query parameters
         */

        const {
            page,
            limit,
            unreadOnly
        } = req.query;


        /*
         * 3. Convert pagination
         */

        const pageNumber =
            page !== undefined
                ? Number(page)
                : undefined;


        const limitNumber =
            limit !== undefined
                ? Number(limit)
                : undefined;


        /*
         * 4. Validate page
         */

        if (
            pageNumber !== undefined &&
            (
                !Number.isInteger(pageNumber) ||
                pageNumber < 1
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid page number"

            });
        }


        /*
         * 5. Validate limit
         */

        if (
            limitNumber !== undefined &&
            (
                !Number.isInteger(limitNumber) ||
                limitNumber < 1 ||
                limitNumber > 100
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Limit must be between 1 and 100"

            });
        }


        /*
         * 6. Validate unreadOnly
         */

        let unreadOnlyValue =
            false;


        if (
            unreadOnly !== undefined
        ) {

            if (
                unreadOnly !== "true" &&
                unreadOnly !== "false"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "unreadOnly must be true or false"

                });
            }


            unreadOnlyValue =
                unreadOnly === "true";
        }


        /*
         * 7. Get notifications
         */

        const result =
            await getNotifications({

                userId:
                    req.user.userId,

                page:
                    pageNumber,

                limit:
                    limitNumber,

                unreadOnly:
                    unreadOnlyValue

            });


        /*
         * 8. Success response
         */

        return res.status(200).json({

            success: true,

            message:
                "Notifications retrieved successfully",

            data:
                result

        });

    } catch (error) {

        console.error(
            "Get notifications error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch notifications"

        });
    }
}


/*
 * ============================================================
 * GET UNREAD NOTIFICATION COUNT
 *
 * GET /api/notifications/unread-count
 * ============================================================
 */

export async function getUnreadCount(
    req: AuthRequest,
    res: Response
) {

    try {

        /*
         * 1. Authentication
         */

        if (!req.user) {

            return res.status(401).json({

                success: false,

                message:
                    "Unauthorized"

            });
        }


        /*
         * 2. Get unread count
         */

        const result =
            await getUnreadNotificationCount(
                req.user.userId
            );


        /*
         * 3. Success response
         */

        return res.status(200).json({

            success: true,

            message:
                "Unread notification count retrieved successfully",

            data:
                result

        });

    } catch (error) {

        console.error(
            "Unread notification count error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch unread notification count"

        });
    }
}


/*
 * ============================================================
 * MARK NOTIFICATION AS READ
 *
 * PATCH /api/notifications/:notificationId/read
 * ============================================================
 */

export async function markAsRead(
    req: AuthRequest,
    res: Response
) {

    try {

        /*
         * 1. Authentication
         */

        if (!req.user) {

            return res.status(401).json({

                success: false,

                message:
                    "Unauthorized"

            });
        }


        /*
         * 2. Notification ID
         */

        const notificationId =
            Number(
                req.params.notificationId
            );


        /*
         * 3. Validate notification ID
         */

        if (
            !Number.isInteger(
                notificationId
            ) ||
            notificationId <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid notification ID"

            });
        }


        /*
         * 4. Mark notification as read
         */

        const result =
            await markNotificationAsRead(

                req.user.userId,

                notificationId

            );


        /*
         * 5. Success response
         */

        return res.status(200).json({

            success: true,

            message:
                "Notification marked as read",

            data: {

                notification:
                    result

            }

        });

    } catch (error: any) {

        console.error(
            "Mark notification as read error:",
            error
        );


        /*
         * Notification not found
         */

        if (
            error.message ===
            "NOTIFICATION_NOT_FOUND"
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "Notification not found"

            });
        }


        return res.status(500).json({

            success: false,

            message:
                "Failed to mark notification as read"

        });
    }
}


/*
 * ============================================================
 * MARK ALL NOTIFICATIONS AS READ
 *
 * PATCH /api/notifications/read-all
 * ============================================================
 */

export async function markAllAsRead(
    req: AuthRequest,
    res: Response
) {

    try {

        /*
         * 1. Authentication
         */

        if (!req.user) {

            return res.status(401).json({

                success: false,

                message:
                    "Unauthorized"

            });
        }


        /*
         * 2. Mark all notifications as read
         */

        const result =
            await markAllNotificationsAsRead(
                req.user.userId
            );


        /*
         * 3. Success response
         */

        return res.status(200).json({

            success: true,

            message:
                "All notifications marked as read",

            data:
                result

        });

    } catch (error) {

        console.error(
            "Mark all notifications as read error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to mark all notifications as read"

        });
    }
}