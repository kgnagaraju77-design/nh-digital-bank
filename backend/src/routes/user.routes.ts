import { Router } from "express";

import {
    getProfile,
    updateProfile
} from "../controllers/user.controller";

import {
    authenticateToken
} from "../middleware/auth.middleware";


const router = Router();


/*
 * ============================================================
 * GET PROFILE
 * ============================================================
 */

router.get(
    "/profile",
    authenticateToken,
    getProfile
);


/*
 * ============================================================
 * UPDATE PROFILE
 * ============================================================
 */

router.put(
    "/profile",
    authenticateToken,
    updateProfile
);


export default router;