import { Response } from "express";

import {
    getAuditLogs
} from "../services/audit.service";

import {
    AuthRequest
} from "../middleware/auth.middleware";


/*
 * ============================================================
 * GET AUDIT LOGS
 *
 * GET /api/security/audit-logs
 * ============================================================
 */

export async function getAuditLogsController(
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
         * Pagination
         */

        const limit =
            Number(req.query.limit || 20);

        const offset =
            Number(req.query.offset || 0);


        /*
         * Validate limit
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


        /*
         * Validate offset
         */

        if (
            !Number.isInteger(offset) ||
            offset < 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Offset must be a non-negative integer"
            });
        }


        /*
         * Get audit logs
         */

        const result =
            await getAuditLogs(
                req.user.userId,
                limit,
                offset
            );


        /*
         * Success response
         */

        return res.status(200).json({

            success: true,

            message:
                "Audit logs retrieved successfully",

            data:
                result
        });

    } catch (error: any) {

        console.error(
            "Audit logs error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to retrieve audit logs"
        });
    }
}