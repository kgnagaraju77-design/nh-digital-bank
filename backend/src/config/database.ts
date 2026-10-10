import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const dbHost = process.env.DB_HOST;
const isLocalDatabase =
    !dbHost || ["localhost", "127.0.0.1"].includes(dbHost);

const caCertificate = process.env.DB_SSL_CA?.replace(/\\n/g, "\n");

if (!isLocalDatabase && !caCertificate) {
    throw new Error(
        "DB_SSL_CA is required for a remote database connection."
    );
}

export const db = mysql.createPool({
    host: dbHost,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    ...(isLocalDatabase
        ? {}
        : {
              ssl: {
                  ca: caCertificate!,
                  rejectUnauthorized: true,
              },
          }),

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});