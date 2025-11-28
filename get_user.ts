
import 'dotenv/config';
import { db } from "./server/db";
import { customers } from "./shared/schema";
import { eq } from "drizzle-orm";

async function main() {
    try {
        const result = await db.select().from(customers).limit(1);
        if (result.length > 0) {
            console.log("User found:");
            console.log("Email:", result[0].admin_email);
            console.log("Password:", result[0].admin_password);
        } else {
            console.log("No users found.");
        }
    } catch (error) {
        console.error("Error fetching user:", error);
    }
    process.exit(0);
}

main();
