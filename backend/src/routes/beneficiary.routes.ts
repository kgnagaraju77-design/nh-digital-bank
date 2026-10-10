import { Router } from "express";

import {
    createBeneficiaryController,
    getAllBeneficiaries,
    getBeneficiary,
    updateBeneficiaryController,
    changeBeneficiaryStatus,
    removeBeneficiary
} from "../controllers/beneficiary.controller";

import {
    authenticateToken
} from "../middleware/auth.middleware";


const router = Router();


/*
 * ============================================================
 * Create Beneficiary
 *
 * POST /api/beneficiaries
 * ============================================================
 */

router.post(
    "/",
    authenticateToken,
    createBeneficiaryController
);


/*
 * ============================================================
 * Get All Beneficiaries
 *
 * GET /api/beneficiaries
 * ============================================================
 */

router.get(
    "/",
    authenticateToken,
    getAllBeneficiaries
);


/*
 * ============================================================
 * Get Beneficiary
 *
 * GET /api/beneficiaries/:beneficiaryId
 * ============================================================
 */

router.get(
    "/:beneficiaryId",
    authenticateToken,
    getBeneficiary
);


/*
 * ============================================================
 * Update Beneficiary
 *
 * PUT /api/beneficiaries/:beneficiaryId
 * ============================================================
 */

router.put(
    "/:beneficiaryId",
    authenticateToken,
    updateBeneficiaryController
);


/*
 * ============================================================
 * Change Beneficiary Status
 *
 * PATCH /api/beneficiaries/:beneficiaryId/status
 * ============================================================
 */

router.patch(
    "/:beneficiaryId/status",
    authenticateToken,
    changeBeneficiaryStatus
);


/*
 * ============================================================
 * Delete Beneficiary
 *
 * DELETE /api/beneficiaries/:beneficiaryId
 * ============================================================
 */

router.delete(
    "/:beneficiaryId",
    authenticateToken,
    removeBeneficiary
);


export default router;