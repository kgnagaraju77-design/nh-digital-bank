import { Response } from "express";

import {
    AuthRequest
} from "../middleware/auth.middleware";

import {
    setTransactionPin,
    verifyTransactionPin,
    changeTransactionPin
} from "../services/transactionPin.service";


/*
 * ============================================================
 * SET TRANSACTION PIN
 *
 * POST /api/security/transaction-pin
 * ============================================================
 */

export async function createTransactionPin(
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
                message: "Unauthorized"
            });
        }


        /*
         * 2. Get PIN
         */

        const { pin } = req.body;


        /*
         * 3. Validate PIN
         */

        if (
            typeof pin !== "string" ||
            !/^\d{6}$/.test(pin)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Transaction PIN must be exactly 6 digits"

            });
        }


        /*
         * 4. Create PIN
         */

        const result =
            await setTransactionPin(
                req.user.userId,
                pin
            );


        /*
         * 5. Success response
         */

        return res.status(201).json({

            success: true,

            message:
                "Transaction PIN created successfully",

            data: {
                transactionPin: result
            }

        });

    } catch (error: any) {

        console.error(
            "Create transaction PIN error:",
            error
        );


        if (
            error.message ===
            "PIN_ALREADY_EXISTS"
        ) {

            return res.status(409).json({

                success: false,

                message:
                    "Transaction PIN already exists"

            });
        }


        if (
            error.message ===
            "INVALID_PIN"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Transaction PIN must be exactly 6 digits"

            });
        }


        return res.status(500).json({

            success: false,

            message:
                "Failed to create transaction PIN"

        });
    }
}


/*
 * ============================================================
 * VERIFY TRANSACTION PIN
 *
 * POST /api/security/transaction-pin/verify
 * ============================================================
 */

export async function verifyPin(
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
                message: "Unauthorized"
            });
        }


        /*
         * 2. Get PIN
         */

        const { pin } = req.body;


        /*
         * 3. Validate PIN
         */

        if (
            typeof pin !== "string" ||
            !/^\d{6}$/.test(pin)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Transaction PIN must be exactly 6 digits"

            });
        }


        /*
         * 4. Verify PIN
         */

        const result =
            await verifyTransactionPin(
                req.user.userId,
                pin
            );


        /*
         * 5. Success response
         */

        return res.status(200).json({

            success: true,

            message:
                "Transaction PIN verified successfully",

            data: result

        });

    } catch (error: any) {

        console.error(
            "Verify transaction PIN error:",
            error
        );


        if (
            error.message ===
            "PIN_NOT_SET"
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "Transaction PIN is not set"

            });
        }


        if (
            error.message ===
            "PIN_BLOCKED"
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "Transaction PIN is blocked"

            });
        }


        if (
            error.message ===
            "INVALID_TRANSACTION_PIN"
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid transaction PIN"

            });
        }


        if (
            error.message ===
            "INVALID_PIN"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Transaction PIN must be exactly 6 digits"

            });
        }


        return res.status(500).json({

            success: false,

            message:
                "Failed to verify transaction PIN"

        });
    }
}

/*
 * ============================================================
 * CHANGE TRANSACTION PIN
 *
 * PUT /api/security/transaction-pin
 * ============================================================
 */

export async function changePin(
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
            currentPin,
            newPin
        } = req.body;

        if (
            typeof currentPin !== "string" ||
            typeof newPin !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Current PIN and new PIN are required"
            });
        }

        const result =
            await changeTransactionPin(
                req.user.userId,
                currentPin,
                newPin
            );

        return res.status(200).json({

            success: true,

            message:
                "Transaction PIN changed successfully",

            data: result

        });

    } catch (error: any) {

        console.error(
            "Change transaction PIN error:",
            error
        );

        const errors: Record<string, string> = {

            PIN_NOT_SET:
                "Transaction PIN is not set",

            PIN_BLOCKED:
                "Transaction PIN is blocked",

            INVALID_CURRENT_PIN:
                "Current transaction PIN is incorrect",

            INVALID_NEW_PIN:
                "New transaction PIN must be exactly 6 digits",

            SAME_PIN:
                "New PIN must be different from current PIN"
        };

        return res.status(400).json({

            success: false,

            message:
                errors[error.message] ||
                "Failed to change transaction PIN"

        });
    }
}