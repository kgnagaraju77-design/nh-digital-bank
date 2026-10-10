import { Request, Response } from "express";

import {
    getUserProfile,
    updateUserProfile
} from "../services/user.service";


interface AuthRequest
    extends Request {

    user?: {
        userId: number;
        customerNumber?: string;
        role?: string;
    };
}


/*
 * ============================================================
 * GET USER PROFILE
 *
 * GET /api/users/profile
 * ============================================================
 */

export async function getProfile(
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


        const profile =
            await getUserProfile(
                req.user.userId
            );


        return res.status(200).json({

            success: true,

            message:
                "Profile retrieved successfully",

            data: profile

        });

    } catch (error: any) {

        console.error(
            "Get profile error:",
            error
        );


        if (
            error.message ===
            "USER_NOT_FOUND"
        ) {

            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }


        return res.status(500).json({

            success: false,

            message:
                "Failed to retrieve profile"

        });
    }
}


/*
 * ============================================================
 * UPDATE USER PROFILE
 *
 * PUT /api/users/profile
 * ============================================================
 */

export async function updateProfile(
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


        const {
            firstName,
            lastName,
            phone
        } = req.body;


        /*
         * Validate fields
         */

        if (
            typeof firstName !== "string" ||
            typeof lastName !== "string" ||
            typeof phone !== "string"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "First name, last name and phone are required"

            });
        }


        if (
            firstName.trim().length < 2 ||
            lastName.trim().length < 2
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "First name and last name must contain at least 2 characters"

            });
        }


        if (
            phone.trim().length < 7
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid phone number"

            });
        }


        const profile =
            await updateUserProfile(
                req.user.userId,
                firstName.trim(),
                lastName.trim(),
                phone.trim()
            );


        return res.status(200).json({

            success: true,

            message:
                "Profile updated successfully",

            data: profile

        });

    } catch (error: any) {

        console.error(
            "Update profile error:",
            error
        );


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


        if (
            error.message ===
            "PHONE_ALREADY_REGISTERED"
        ) {

            return res.status(409).json({

                success: false,

                message:
                    "Phone number already registered"

            });
        }


        return res.status(500).json({

            success: false,

            message:
                "Failed to update profile"

        });
    }
}