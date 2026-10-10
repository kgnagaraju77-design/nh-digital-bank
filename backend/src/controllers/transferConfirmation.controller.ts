import { Response } from "express";

import {
    AuthRequest
} from "../middleware/auth.middleware";

import {
    verifyTransactionPin
} from "../services/transactionPin.service";

import {
    verifyOtp
} from "../services/otp.service";

import {
    confirmTransfer
} from "../services/transfer.service";


/*
 * ============================================================
 * CONFIRM FUND TRANSFER
 *
 * POST /api/transfers/confirm
 * ============================================================
 */

export async function confirmTransferController(
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
         * 2. Request data
         */

        const {
            transactionId,
            transactionPin,
            otp
        } = req.body;


        /*
         * 3. Validate transaction ID
         */

        const transactionIdNumber =
            Number(transactionId);


        if (
            !Number.isInteger(
                transactionIdNumber
            ) ||
            transactionIdNumber <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid transaction ID"

            });
        }


        /*
         * 4. Validate Transaction PIN
         */

        if (
            typeof transactionPin !== "string" ||
            !/^\d{6}$/.test(transactionPin)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Transaction PIN must be exactly 6 digits"

            });
        }


        /*
         * 5. Validate OTP
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
         * 6. Verify Transaction PIN
         */

        await verifyTransactionPin(
            req.user.userId,
            transactionPin
        );


        /*
         * 7. Verify OTP
         */

       await verifyOtp(
    req.user.userId,
    otp,
    transactionIdNumber,
    "FUND_TRANSFER"
);

        /*
         * 8. Execute transfer
         */

        const result =
            await confirmTransfer(
                req.user.userId,
                transactionIdNumber
            );


        /*
         * 9. Successful response
         */

        return res.status(200).json({

            success: true,

            message:
                "Fund transfer successful",

            data: {

                transaction:
                    result

            }

        });

    } catch (error: any) {

        console.error(
            "Confirm transfer error:",
            error
        );


        const errors:
            Record<string, string> = {

            TRANSACTION_NOT_FOUND:
                "Transaction not found",

            TRANSACTION_NOT_PENDING:
                "Transaction is not pending",

            SENDER_ACCOUNT_NOT_FOUND:
                "Sender account not found",

            SENDER_ACCOUNT_INACTIVE:
                "Sender account is inactive",

            RECEIVER_ACCOUNT_NOT_FOUND:
                "Receiver account not found",

            RECEIVER_ACCOUNT_INACTIVE:
                "Receiver account is inactive",

            INSUFFICIENT_BALANCE:
                "Insufficient balance",

            INVALID_PIN:
                "Invalid transaction PIN",

            PIN_NOT_FOUND:
                "Transaction PIN not found",

            PIN_BLOCKED:
                "Transaction PIN is blocked",

            INVALID_OTP:
                "Invalid OTP",

            OTP_NOT_FOUND:
                "OTP not found",

            OTP_EXPIRED:
                "OTP has expired",

            OTP_BLOCKED:
                "OTP is blocked"

        };


        return res.status(400).json({

            success: false,

            message:
                errors[error.message] ||
                "Fund transfer confirmation failed"

        });
    }
}