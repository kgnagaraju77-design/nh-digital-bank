import { Response } from "express";

import {
    AuthRequest
} from "../middleware/auth.middleware";

import {
    initiateTransfer
} from "../services/transferInitiation.service";


export async function initiateTransferController(
    req: AuthRequest,
    res: Response
) {

    try {

        if (!req.user) {

            return res.status(401).json({

                success: false,

                message:
                    "Unauthorized"

            });
        }


        const {
            senderAccountId,
            beneficiaryId,
            amount,
            remarks
        } = req.body;


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


        const senderAccountIdNumber =
            Number(senderAccountId);

        const beneficiaryIdNumber =
            Number(beneficiaryId);

        const amountNumber =
            Number(amount);


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


        const decimalAmount =
            Math.round(
                amountNumber * 100
            ) / 100;


        if (
            decimalAmount !== amountNumber
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Transfer amount can have maximum 2 decimal places"

            });
        }


        const result =
            await initiateTransfer({

                userId:
                    req.user.userId,

                senderAccountId:
                    senderAccountIdNumber,

                beneficiaryId:
                    beneficiaryIdNumber,

                amount:
                    decimalAmount,

                remarks:
                    typeof remarks === "string"
                        ? remarks.trim()
                        : undefined

            });


        return res.status(201).json({

            success: true,

            message:
                "Transfer initiated successfully",

            data: {

                transaction:
                    result

            }

        });

    } catch (error: any) {

        console.error(
            "Transfer initiation error:",
            error
        );


        const errors:
            Record<string, string> = {

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

            SELF_TRANSFER_NOT_ALLOWED:
                "Transfers to your own account are not allowed",

            INSUFFICIENT_BALANCE:
                "Insufficient balance",

            INVALID_AMOUNT:
                "Invalid transfer amount"

        };


        return res.status(400).json({

            success: false,

            message:
                errors[error.message] ||
                "Transfer initiation failed"

        });
    }
}