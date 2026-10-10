import dotenv from "dotenv";

dotenv.config();

import app from "./app";
import userRoutes from "./routes/user.routes";

import {
    testDatabaseConnection
} from "./config/testDatabase";

import securityRoutes
    from "./routes/security.routes";


const PORT =
    process.env.PORT || 5000;


/*
 * Test database connection
 */
testDatabaseConnection();


/*
 * User routes
 */
app.use(
    "/api/users",
    userRoutes
);


/*
 * Security routes
 */
app.use(
    "/api/security",
    securityRoutes
);


/*
 * Start server
 */
app.listen(PORT, () => {

    console.log(
        `Server running on http://localhost:${PORT}`
    );

});