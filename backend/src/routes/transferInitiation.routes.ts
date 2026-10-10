import {
    Router
} from "express";

import {
    authenticateToken
} from "../middleware/auth.middleware";

import {
    initiateTransferController
} from "../controllers/transferInitiation.controller";


const router =
    Router();


router.post(
    "/initiate",
    authenticateToken,
    initiateTransferController
);


export default router;