import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { db } from "../config/database";

export async function getDashboard(
    req: AuthRequest,
    res: Response
) {
    try {

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const [rows] = await db.query(
            `SELECT
                id,
                customer_number,
                first_name,
                last_name,
                email,
                phone,
                role,
                status,
                last_login_at
             FROM users
             WHERE id = ?`,
            [req.user.userId]
        );

        const users = rows as any[];

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const user = users[0];

        return res.status(200).json({
            success: true,
            data: {
                customer: {
                    id: user.id,
                    customerNumber: user.customer_number,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    status: user.status,
                    lastLoginAt: user.last_login_at
                }
            }
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Unable to load dashboard"
        });
    }
}