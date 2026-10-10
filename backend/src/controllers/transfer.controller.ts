import { Response } from "express";

import {
    AuthRequest
} from "../middleware/auth.middleware";

import {
    transferMoney
} from "../services/transfer.service";


/*
 * ============================================================
 * CREATE FUND TRANSFER
 *
 * POST /api/transfers
 *
 * IMPORTANT:
 * This endpoint ONLY creates a PENDING transfer.
 *
 * Transaction PIN and OTP are NOT verified here.
 *
 * Final authorization happens through:
 *
 * POST /api/transfers/confirm
 *
 * Transaction PIN + OTP
 * ============================================================
 */

export async function createTransfer(
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
         *
         * Transaction PIN is intentionally NOT
         * accepted during transfer initiation.
         */

        const {
            senderAccountId,
            beneficiaryId,
            amount,
            remarks
        } = req.body;


        /*
         * 3. Validate required fields
         */

        if (
            senderAccountId === undefined ||
            beneficiaryId === undefined ||
            amount === undefined
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Sender account, beneficiary and amount are required"

            });
        }


        /*
         * 4. Convert numeric values
         */

        const senderAccountIdNumber =
            Number(senderAccountId);

        const beneficiaryIdNumber =
            Number(beneficiaryId);

        const amountNumber =
            Number(amount);


        /*
         * 5. Validate sender account
         */

        if (
            !Number.isInteger(
                senderAccountIdNumber
            ) ||
            senderAccountIdNumber <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid sender account"

            });
        }


        /*
         * 6. Validate beneficiary
         */

        if (
            !Number.isInteger(
                beneficiaryIdNumber
            ) ||
            beneficiaryIdNumber <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid beneficiary"

            });
        }


        /*
         * 7. Validate amount
         */

        if (
            !Number.isFinite(amountNumber) ||
            amountNumber <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid transfer amount"

            });
        }


        /*
         * 8. Validate decimal precision
         *
         * Database:
         * DECIMAL(15,2)
         */

        const decimalAmount =
            Math.round(
                amountNumber * 100
            ) / 100;


        if (
            decimalAmount <= 0 ||
            decimalAmount !== amountNumber
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Transfer amount can have maximum 2 decimal places"

            });
        }


        /*
         * 9. Validate remarks
         */

        if (
            remarks !== undefined &&
            (
                typeof remarks !== "string" ||
                remarks.length > 255
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Remarks must be a string with maximum 255 characters"

            });
        }


        /*
         * 10. Create PENDING transfer
         *
         * IMPORTANT:
         *
         * No Transaction PIN here.
         * No OTP here.
         *
         * The transfer service creates the pending
         * transaction. Money should NOT be considered
         * transferred until final confirmation.
         */

        const result =
            await transferMoney({

                userId:
                    req.user.userId,

                senderAccountId:
                    senderAccountIdNumber,

                beneficiaryId:
                    beneficiaryIdNumber,

                amount:
                    decimalAmount,

                remarks:
                    remarks !== undefined
                        ? remarks.trim()
                        : undefined

            });


        /*
         * 11. Successful response
         */

        return res.status(200).json({

            success: true,

            message:
                "Transfer created successfully. Authorization required.",

            data: {

                transaction:
                    result

            }

        });

    } catch (error: any) {

        console.error(
            "Transfer creation error:",
            error
        );


        /*
         * 12. Business error mapping
         */

        const errors: Record<
            string,
            string
        > = {

            SENDER_ACCOUNT_NOT_FOUND:
                "Sender account not found",

            SENDER_ACCOUNT_INACTIVE:
                "Sender account is inactive",

            BENEFICIARY_NOT_FOUND:
                "Beneficiary not found",

            BENEFICIARY_INACTIVE:
                "Beneficiary is inactive",

            RECEIVER_ACCOUNT_NOT_FOUND:
                "Receiver account not found",

            RECEIVER_ACCOUNT_INACTIVE:
                "Receiver account is inactive",

            INSUFFICIENT_BALANCE:
                "Insufficient balance",

            INVALID_AMOUNT:
                "Invalid transfer amount",

            SELF_TRANSFER_NOT_ALLOWED:
                "Transfers to your own account are not allowed"

        };


        const message =
            errors[error.message] ||
            "Unable to create transfer";


        /*
         * 13. Business error response
         */

        return res.status(400).json({

            success: false,

            message

        });

    }

}