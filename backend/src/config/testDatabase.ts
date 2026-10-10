import { db } from "./database";

export async function testDatabaseConnection() {
  try {
    const connection = await db.getConnection();

    console.log("MySQL database connected successfully");

    connection.release();
  } catch (error) {
    console.error("MySQL connection failed:", error);
  }
}