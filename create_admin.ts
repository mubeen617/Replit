
import 'dotenv/config';
import { db } from "./server/db";
import { customers } from "./shared/schema";
import bcrypt from "bcryptjs";

async function main() {
    try {
        const hashedPassword = await bcrypt.hash("password123", 12);
        const newCustomer = {
            name: "Test Admin",
            domain: "test.com",
            admin_name: "Test Admin",
            admin_email: "admin@test.com",
            admin_password: hashedPassword,
            status: "active",
        };

        const result = await db.insert(customers).values(newCustomer).returning();
        console.log("Admin created:", result[0]);
    } catch (error) {
        console.error("Error creating admin:", error);
    }
    process.exit(0);
}

main();
