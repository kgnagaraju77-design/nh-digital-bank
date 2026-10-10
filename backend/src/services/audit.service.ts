import { db } from "../config/database";


/*
 * ============================================================
 * CREATE AUDIT LOG
 * ============================================================
 */

export async function createAuditLog(
    userId: number,
    action: string,
    description: string | null = null,
    ipAddress: string | null = null,
    userAgent: string | null = null
) {

    console.log("CREATE AUDIT LOG CALLED:", {
        userId,
        action,
        description,
        ipAddress,
        userAgent
    });

    await db.query(
        `
        INSERT INTO audit_logs
        (
            user_id,
            action,
            description,
            ip_address,
            user_agent
        )
        VALUES (?, ?, ?, ?, ?)
        `,
        [
            userId,
            action,
            description,
            ipAddress,
            userAgent
        ]
    );

    console.log("AUDIT LOG INSERTED SUCCESSFULLY");
}


/*
 * ============================================================
 * GET AUDIT LOGS
 * ============================================================
 */

export async function getAuditLogs(
    userId: number,
    limit: number = 20,
    offset: number = 0
) {

    const safeLimit = Math.min(
        Math.max(Number(limit) || 20, 1),
        100
    );

    const safeOffset = Math.max(
        Number(offset) || 0,
        0
    );


    /*
     * Get records
     */

    const [rows] = await db.query(
        `
        SELECT
            id,
            action,
            description,
            ip_address,
            user_agent,
            created_at

        FROM audit_logs

        WHERE user_id = ?

        ORDER BY created_at DESC

        LIMIT ? OFFSET ?
        `,
        [
            userId,
            safeLimit,
            safeOffset
        ]
    );


    /*
     * Get total count
     */

    const [countRows] = await db.query(
        `
        SELECT
            COUNT(*) AS total

        FROM audit_logs

        WHERE user_id = ?
        `,
        [userId]
    );


    const records =
        rows as any[];

    const countResult =
        countRows as any[];

    const total =
        Number(
            countResult[0]?.total || 0
        );


    return {

        records: records.map(
            (record) => ({

                id:
                    record.id,

                action:
                    record.action,

                description:
                    record.description,

                ipAddress:
                    record.ip_address,

                userAgent:
                    record.user_agent,

                createdAt:
                    record.created_at
            })
        ),

        pagination: {

            limit:
                safeLimit,

            offset:
                safeOffset,

            count:
                total
        }
    };
}