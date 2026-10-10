import { db } from "../config/database";


/*
 * ============================================================
 * NOTIFICATION TYPES
 * ============================================================
 */

export type NotificationType =
    | "LOGIN"
    | "TRANSFER"
    | "BENEFICIARY"
    | "PASSWORD"
    | "SECURITY"
    | "SYSTEM";


/*
 * ============================================================
 * CREATE NOTIFICATION
 * ============================================================
 */

export async function createNotification(
    userId: number,
    title: string,
    message: string,
    type: NotificationType
) {

    const [result] =
        await db.query(
            `
            INSERT INTO notifications
            (
                user_id,
                title,
                message,
                type
            )
            VALUES (?, ?, ?, ?)
            `,
            [
                userId,
                title,
                message,
                type
            ]
        );


    const insertResult =
        result as any;


    return {
        id:
            insertResult.insertId,

        userId,

        title,

        message,

        type,

        isRead: false
    };
}


/*
 * ============================================================
 * GET USER NOTIFICATIONS
 *
 * Pagination supported
 * ============================================================
 */

interface GetNotificationsOptions {

    userId: number;

    page?: number;

    limit?: number;

    unreadOnly?: boolean;
}


export async function getNotifications(
    options: GetNotificationsOptions
) {

    const {

        userId,

        page = 1,

        limit = 20,

        unreadOnly = false

    } = options;


    /*
     * Pagination
     */

    const safePage =
        Math.max(
            1,
            Number(page)
        );


    const safeLimit =
        Math.min(
            100,
            Math.max(
                1,
                Number(limit)
            )
        );


    const offset =
        (safePage - 1) *
        safeLimit;


    /*
     * Build conditions
     */

    const conditions: string[] = [
        "user_id = ?"
    ];


    const parameters: any[] = [
        userId
    ];


    if (unreadOnly) {

        conditions.push(
            "is_read = FALSE"
        );
    }


    const whereClause =
        conditions.join(
            " AND "
        );


    /*
     * Count notifications
     */

    const [countRows] =
        await db.query(
            `
            SELECT
                COUNT(*) AS total

            FROM notifications

            WHERE ${whereClause}
            `,
            parameters
        );


    const total =
        Number(
            (countRows as any[])[0]
                .total
        );


    /*
     * Get notifications
     */

    const [rows] =
        await db.query(
            `
            SELECT
                id,
                title,
                message,
                type,
                is_read,
                created_at,
                updated_at

            FROM notifications

            WHERE ${whereClause}

            ORDER BY
                created_at DESC,
                id DESC

            LIMIT ?

            OFFSET ?
            `,
            [
                ...parameters,
                safeLimit,
                offset
            ]
        );


    const notifications =
        (rows as any[]).map(
            notification => ({

                id:
                    notification.id,

                title:
                    notification.title,

                message:
                    notification.message,

                type:
                    notification.type,

                isRead:
                    Boolean(
                        notification.is_read
                    ),

                createdAt:
                    notification.created_at,

                updatedAt:
                    notification.updated_at

            })
        );


    const totalPages =
        Math.ceil(
            total / safeLimit
        );


    return {

        notifications,

        pagination: {

            page:
                safePage,

            limit:
                safeLimit,

            total,

            totalPages,

            hasNextPage:
                safePage < totalPages,

            hasPreviousPage:
                safePage > 1

        }

    };
}


/*
 * ============================================================
 * GET UNREAD NOTIFICATION COUNT
 * ============================================================
 */

export async function getUnreadNotificationCount(
    userId: number
) {

    const [rows] =
        await db.query(
            `
            SELECT
                COUNT(*) AS unreadCount

            FROM notifications

            WHERE user_id = ?

            AND is_read = FALSE
            `,
            [
                userId
            ]
        );


    const result =
        (rows as any[])[0];


    return {

        unreadCount:
            Number(
                result.unreadCount
            )

    };
}


/*
 * ============================================================
 * MARK NOTIFICATION AS READ
 * ============================================================
 */

export async function markNotificationAsRead(
    userId: number,
    notificationId: number
) {

    /*
     * Verify notification belongs
     * to logged-in user.
     */

    const [rows] =
        await db.query(
            `
            SELECT
                id,
                is_read

            FROM notifications

            WHERE id = ?

            AND user_id = ?

            LIMIT 1
            `,
            [
                notificationId,
                userId
            ]
        );


    const notifications =
        rows as any[];


    if (
        notifications.length === 0
    ) {

        throw new Error(
            "NOTIFICATION_NOT_FOUND"
        );
    }


    /*
     * Already read
     */

    if (
        Boolean(
            notifications[0].is_read
        )
    ) {

        return {

            id:
                notificationId,

            isRead:
                true

        };
    }


    /*
     * Mark as read
     */

    await db.query(
        `
        UPDATE notifications

        SET
            is_read = TRUE

        WHERE id = ?

        AND user_id = ?
        `,
        [
            notificationId,
            userId
        ]
    );


    return {

        id:
            notificationId,

        isRead:
            true

    };
}


/*
 * ============================================================
 * MARK ALL NOTIFICATIONS AS READ
 * ============================================================
 */

export async function markAllNotificationsAsRead(
    userId: number
) {

    const [result] =
        await db.query(
            `
            UPDATE notifications

            SET
                is_read = TRUE

            WHERE user_id = ?

            AND is_read = FALSE
            `,
            [
                userId
            ]
        );


    const updateResult =
        result as any;


    return {

        updatedCount:
            updateResult.affectedRows

    };
}