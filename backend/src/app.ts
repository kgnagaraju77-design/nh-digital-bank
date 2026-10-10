import express from "express";
import cors from "cors";
import helmet from "helmet";

import transactionRoutes
    from "./routes/transaction.routes";

import notificationRoutes
    from "./routes/notification.routes";

import authRoutes
    from "./routes/auth.routes";

import dashboardRoutes
    from "./routes/dashboard.routes";

import accountRoutes
    from "./routes/account.routes";

import beneficiaryRoutes
    from "./routes/beneficiary.routes";

import transferRoutes
    from "./routes/transfer.routes";

    import transactionPinRoutes
    from "./routes/transactionPin.routes";

    import otpRoutes
    from "./routes/otp.routes";

import transferInitiationRoutes
    from "./routes/transferInitiation.routes";

    import transferConfirmationRoutes
    from "./routes/transferConfirmation.routes";


const app = express();


app.use(helmet());

app.use(cors());

app.use(express.json());


/*
 * Authentication
 */
app.use(
    "/api/auth",
    authRoutes
);


/*
 * Dashboard
 */
app.use(
    "/api/dashboard",
    dashboardRoutes
);


/*
 * Accounts
 */
app.use(
    "/api/accounts",
    accountRoutes
);


/*
 * Beneficiaries
 */
app.use(
    "/api/beneficiaries",
    beneficiaryRoutes
);


/*
 * Fund Transfer
 */
app.use(
    "/api/transfers",
    transferRoutes
);


/*
 * Transaction History
 */
app.use(
    "/api/transactions",
    transactionRoutes
);


/*
 * Notifications
 */
app.use(
    "/api/notifications",
    notificationRoutes
);

app.use(
    "/api/security",
    transactionPinRoutes
);

app.use(
    "/api/security/otp",
    otpRoutes
);

app.use(
    "/api/transfers",
    transferInitiationRoutes
);

/*
 * Transfer Confirmation
 */
app.use(
    "/api/transfers",
    transferConfirmationRoutes
);

/*
 * Health check
 */
app.get(
    "/api/health",
    (_req, res) => {

        res.status(200).json({

            status: "UP",

            service:
                "digital-banking-api",

            timestamp:
                new Date().toISOString()

        });

    }
);



export default app;