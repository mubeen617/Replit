
import 'dotenv/config';
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
    const result = await db.execute(sql`SELECT id FROM customers LIMIT 1`);
    console.log(JSON.stringify(result[0]));
    process.exit(0);
}

main();
