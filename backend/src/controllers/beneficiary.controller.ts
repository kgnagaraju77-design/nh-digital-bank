import {  Response } from "express";

import {
    AuthRequest
} from "../middleware/auth.middleware";

import {
    createBeneficiary,
    getBeneficiaries,
    getBeneficiaryById,
    updateBeneficiary,
    updateBeneficiaryStatus,
    deleteBeneficiary
} from "../services/beneficiary.service";

/*
 * ============================================================
 * CREATE BENEFICIARY
 *
 * POST /api/beneficiaries
 * ============================================================
 */

export async function createBeneficiaryController(
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
         * 2. Get request body
         */

        const {
            beneficiaryName,
            accountNumber,
            bankName,
            ifscCode
        } = req.body;


        /*
         * 3. Validate beneficiary name
         */

        if (
            typeof beneficiaryName !== "string" ||
            !beneficiaryName.trim()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Beneficiary name is required"

            });
        }


        /*
         * 4. Validate account number
         */

        if (
            typeof accountNumber !== "string" ||
            !accountNumber.trim()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Account number is required"

            });
        }


        /*
         * 5. Validate bank name
         */

        if (
            typeof bankName !== "string" ||
            !bankName.trim()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Bank name is required"

            });
        }


        /*
         * 6. Validate IFSC
         */

        if (
            typeof ifscCode !== "string" ||
            !ifscCode.trim()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "IFSC code is required"

            });
        }


        /*
         * 7. Create beneficiary
         */

        const result =
            await createBeneficiary({

                userId:
                    req.user.userId,

                beneficiaryName:
                    beneficiaryName.trim(),

                accountNumber:
                    accountNumber.trim(),

                bankName:
                    bankName.trim(),

                ifscCode:
                    ifscCode.trim()
            });


        /*
         * 8. Success response
         */

        return res.status(201).json({

            success: true,

            message:
                "Beneficiary created successfully",

            data: {

                beneficiary: result

            }

        });

    } catch (error: any) {

        console.error(
            "Create beneficiary error:",
            error
        );


        /*
         * Business errors
         */

        const errors: Record<string, string> = {

            INVALID_BENEFICIARY_NAME:
                "Invalid beneficiary name",

            INVALID_ACCOUNT_NUMBER:
                "Invalid account number",

            ACCOUNT_NOT_FOUND:
                "Account not found",

            ACCOUNT_INACTIVE:
                "Account is inactive",

            CANNOT_ADD_OWN_ACCOUNT:
                "You cannot add your own account as a beneficiary",

            BENEFICIARY_ALREADY_EXISTS:
                "Beneficiary already exists"

        };


        const message =
            errors[error.message];


        if (message) {

            return res.status(400).json({

                success: false,

                message

            });
        }


        /*
         * Unexpected error
         */

        return res.status(500).json({

            success: false,

            message:
                "Failed to create beneficiary"

        });
    }
}


/*
 * ============================================================
 * GET ALL BENEFICIARIES
 *
 * GET /api/beneficiaries
 * ============================================================
 */

export async function getAllBeneficiaries(
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


        const beneficiaries =
            await getBeneficiaries(
                req.user.userId
            );


        return res.status(200).json({

            success: true,

            data: {
                beneficiaries
            }

        });

    } catch (error) {

        console.error(
            "Get beneficiaries error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch beneficiaries"

        });
    }
}


/*
 * ============================================================
 * GET BENEFICIARY BY ID
 *
 * GET /api/beneficiaries/:beneficiaryId
 * ============================================================
 */

export async function getBeneficiary(
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


        const beneficiaryId =
            Number(
                req.params.beneficiaryId
            );


        if (
            !Number.isInteger(beneficiaryId) ||
            beneficiaryId <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid beneficiary ID"

            });
        }


        const beneficiary =
            await getBeneficiaryById(
                req.user.userId,
                beneficiaryId
            );


        return res.status(200).json({

            success: true,

            data: {
                beneficiary
            }

        });

    } catch (error: any) {

        console.error(
            "Get beneficiary error:",
            error
        );


        if (
            error.message ===
            "BENEFICIARY_NOT_FOUND"
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "Beneficiary not found"

            });
        }


        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch beneficiary"

        });
    }
}


/*
 * ============================================================
 * UPDATE BENEFICIARY
 *
 * PUT /api/beneficiaries/:beneficiaryId
 * ============================================================
 */

export async function updateBeneficiaryController(
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


        const beneficiaryId =
            Number(
                req.params.beneficiaryId
            );


        if (
            !Number.isInteger(beneficiaryId) ||
            beneficiaryId <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid beneficiary ID"

            });
        }


        const {
            beneficiaryName,
            accountNumber
        } = req.body;


        if (
            beneficiaryName === undefined &&
            accountNumber === undefined
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "At least one field is required"

            });
        }


        if (
            beneficiaryName !== undefined &&
            (
                typeof beneficiaryName !== "string" ||
                !beneficiaryName.trim()
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid beneficiary name"

            });
        }


        if (
            accountNumber !== undefined &&
            (
                typeof accountNumber !== "string" ||
                !accountNumber.trim()
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid account number"

            });
        }


        const beneficiary =
            await updateBeneficiary({

                userId:
                    req.user.userId,

                beneficiaryId,

                beneficiaryName:
                    beneficiaryName !== undefined
                        ? beneficiaryName.trim()
                        : undefined,

                accountNumber:
                    accountNumber !== undefined
                        ? accountNumber.trim()
                        : undefined
            });


        return res.status(200).json({

            success: true,

            message:
                "Beneficiary updated successfully",

            data: {
                beneficiary
            }

        });

    } catch (error: any) {

        console.error(
            "Update beneficiary error:",
            error
        );


        const errors: Record<string, string> = {

            BENEFICIARY_NOT_FOUND:
                "Beneficiary not found",

            INVALID_BENEFICIARY_NAME:
                "Invalid beneficiary name",

            INVALID_ACCOUNT_NUMBER:
                "Invalid account number",

            ACCOUNT_NOT_FOUND:
                "Account not found",

            ACCOUNT_INACTIVE:
                "Account is inactive",

            CANNOT_ADD_OWN_ACCOUNT:
                "You cannot use your own account",

            BENEFICIARY_ALREADY_EXISTS:
                "Beneficiary already exists"
        };


        if (
            error.message ===
            "BENEFICIARY_NOT_FOUND"
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "Beneficiary not found"

            });
        }


        return res.status(400).json({

            success: false,

            message:
                errors[error.message] ||
                "Failed to update beneficiary"

        });
    }
}


/*
 * ============================================================
 * CHANGE BENEFICIARY STATUS
 *
 * PATCH /api/beneficiaries/:beneficiaryId/status
 * ============================================================
 */

export async function changeBeneficiaryStatus(
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


        const beneficiaryId =
            Number(
                req.params.beneficiaryId
            );


        if (
            !Number.isInteger(beneficiaryId) ||
            beneficiaryId <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid beneficiary ID"

            });
        }


        const {
            status
        } = req.body;


        if (
    status !== "ACTIVE" &&
    status !== "BLOCKED" &&
    status !== "DELETED"
) {
    return res.status(400).json({
        success: false,
        message:
            "Status must be ACTIVE, BLOCKED or DELETED"
    });
}


        const result =
            await updateBeneficiaryStatus(

                req.user.userId,

                beneficiaryId,

                status
            );


        return res.status(200).json({

            success: true,

            message:
                `Beneficiary ${status.toLowerCase()} successfully`,

            data: {
                beneficiary: result
            }

        });

    } catch (error: any) {

        console.error(
            "Beneficiary status error:",
            error
        );


        if (
            error.message ===
            "BENEFICIARY_NOT_FOUND"
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "Beneficiary not found"

            });
        }


        return res.status(500).json({

            success: false,

            message:
                "Failed to update beneficiary status"

        });
    }
}


/*
 * ============================================================
 * DELETE BENEFICIARY
 *
 * DELETE /api/beneficiaries/:beneficiaryId
 * ============================================================
 */

export async function removeBeneficiary(
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


        const beneficiaryId =
            Number(
                req.params.beneficiaryId
            );


        if (
            !Number.isInteger(beneficiaryId) ||
            beneficiaryId <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid beneficiary ID"

            });
        }


        const result =
            await deleteBeneficiary(

                req.user.userId,

                beneficiaryId
            );


        return res.status(200).json({

            success: true,

            message:
                "Beneficiary deleted successfully",

            data: {
                beneficiary: result
            }

        });

    } catch (error: any) {

        console.error(
            "Delete beneficiary error:",
            error
        );


        if (
            error.message ===
            "BENEFICIARY_NOT_FOUND"
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "Beneficiary not found"

            });
        }


        return res.status(500).json({

            success: false,

            message:
                "Failed to delete beneficiary"

        });
    }
}