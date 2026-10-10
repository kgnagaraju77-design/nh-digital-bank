import { Response } from "express";

import {
    AuthRequest
} from "../middleware/auth.middleware";

import {
    generateOtp,
    verifyOtp,
    OtpPurpose
} from "../services/otp.service";


/*
 * ============================================================
 * GENERATE OTP
 *
 * POST /api/security/otp/generate
 * ============================================================
 */

export async function generateTransactionOtp(
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
         * 2. Get request data
         */

        const {
            transactionId,
            purpose
        } = req.body;


        /*
         * 3. Set default purpose
         */

        const otpPurpose:
            OtpPurpose =
            purpose || "FUND_TRANSFER";


        /*
         * 4. Validate purpose
         */

        const validPurposes = [

            "FUND_TRANSFER",

            "LOGIN",

            "PASSWORD_RESET",

            "BENEFICIARY"

        ];


        if (
            !validPurposes.includes(
                otpPurpose
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid OTP purpose"

            });
        }


        /*
         * 5. Transaction ID is required
         *    for fund transfer OTP.
         */

        if (
            otpPurpose === "FUND_TRANSFER" &&
            (
                transactionId === undefined ||
                !Number.isInteger(
                    Number(transactionId)
                ) ||
                Number(transactionId) <= 0
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Transaction ID is required for fund transfer OTP"

            });
        }


        /*
         * 6. Validate transaction ID
         */

        if (
            transactionId !== undefined &&
            (
                !Number.isInteger(
                    Number(transactionId)
                ) ||
                Number(transactionId) <= 0
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid transaction ID"

            });
        }


        /*
         * 7. Generate OTP
         */

        const result =
            await generateOtp({

                userId:
                    req.user.userId,

                transactionId:
                    transactionId !== undefined
                        ? Number(transactionId)
                        : undefined,

                purpose:
                    otpPurpose

            });


        /*
         * 8. Success response
         */

        return res.status(200).json({

            success: true,

            message:
                "OTP generated successfully",

            data: {

                otp:
                    result.otp,

                otpId:
                    result.id,

                transactionId:
                    transactionId !== undefined
                        ? Number(transactionId)
                        : null,

                purpose:
                    result.purpose,

                expiresAt:
                    result.expiresAt

            }

        });

    } catch (error: any) {

        console.error(
            "Generate OTP error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to generate OTP"

        });
    }
}


/*
 * ============================================================
 * VERIFY OTP
 *
 * POST /api/security/otp/verify
 * ============================================================
 */

export async function verifyTransactionOtp(
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
         * 2. Get request data
         */

        const {
            otp,
            transactionId,
            purpose
        } = req.body;


        /*
         * 3. Validate OTP
         */

        if (
            typeof otp !== "string" ||
            !/^\d{6}$/.test(otp)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "OTP must be exactly 6 digits"

            });
        }


        /*
         * 4. Set default purpose
         */

        const otpPurpose:
            OtpPurpose =
            purpose || "FUND_TRANSFER";


        /*
         * 5. Validate purpose
         */

        const validPurposes = [

            "FUND_TRANSFER",

            "LOGIN",

            "PASSWORD_RESET",

            "BENEFICIARY"

        ];


        if (
            !validPurposes.includes(
                otpPurpose
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid OTP purpose"

            });
        }


        /*
         * 6. Transaction ID required
         *    for fund transfer OTP.
         */

        if (
            otpPurpose === "FUND_TRANSFER" &&
            (
                transactionId === undefined ||
                !Number.isInteger(
                    Number(transactionId)
                ) ||
                Number(transactionId) <= 0
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Transaction ID is required for fund transfer OTP"

            });
        }


        /*
         * 7. Validate transaction ID
         */

        if (
            transactionId !== undefined &&
            (
                !Number.isInteger(
                    Number(transactionId)
                ) ||
                Number(transactionId) <= 0
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid transaction ID"

            });
        }


        /*
         * 8. Verify OTP
         */

        const result =
            await verifyOtp(

                req.user.userId,

                otp,

                transactionId !== undefined
                    ? Number(transactionId)
                    : undefined,

                otpPurpose

            );


        /*
         * 9. Success response
         */

        return res.status(200).json({

            success: true,

            message:
                "OTP verified successfully",

            data: result

        });

    } catch (error: any) {

        console.error(
            "Verify OTP error:",
            error
        );


        /*
         * 10. Error mapping
         */

        const errors:
            Record<string, string> = {

            INVALID_OTP:
                "Invalid OTP",

            OTP_NOT_FOUND:
                "OTP not found",

            OTP_EXPIRED:
                "OTP has expired",

            OTP_BLOCKED:
                "OTP is blocked"

        };


        /*
         * 11. Error response
         */

        return res.status(400).json({

            success: false,

            message:
                errors[error.message] ||
                "OTP verification failed"

        });
    }
}