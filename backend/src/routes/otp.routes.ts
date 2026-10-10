import {
    Router
} from "express";

import {
    authenticateToken
} from "../middleware/auth.middleware";

import {
    generateTransactionOtp,
    verifyTransactionOtp
} from "../controllers/otp.controller";


const router =
    Router();


/*
 * Generate OTP
 *
 * POST /api/security/otp/generate
 */

router.post(
    "/generate",
    authenticateToken,
    generateTransactionOtp
);


/*
 * Verify OTP
 *
 * POST /api/security/otp/verify
 */

router.post(
    "/verify",
    authenticateToken,
    verifyTransactionOtp
);


export default router;