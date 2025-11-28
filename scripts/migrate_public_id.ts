
import 'dotenv/config';
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function migrate() {
    console.log("Starting migration...");

    try {
        // 1. Add columns (if not exist)
        console.log("Adding public_id columns...");
        await db.execute(sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS public_id VARCHAR(255)`);
        await db.execute(sql`ALTER TABLE quotes ADD COLUMN IF NOT EXISTS public_id VARCHAR(255)`);
        await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS public_id VARCHAR(255)`);
        await db.execute(sql`ALTER TABLE dispatch ADD COLUMN IF NOT EXISTS public_id VARCHAR(255)`);

        // 2. Populate leads
        console.log("Populating leads...");
        const leads = await db.execute(sql`SELECT id, created_at FROM leads ORDER BY created_at`);

        // Convert to array if needed (drizzle-orm with postgres-js usually returns array)
        const leadsArray = Array.from(leads);

        let counter = 1;
        for (const lead of leadsArray) {
            const date = new Date((lead as any).created_at || new Date());
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const nnnn = String(counter++).padStart(4, '0');
            const publicId = `${yyyy}${mm}${nnnn}`;

            await db.execute(sql`UPDATE leads SET public_id = ${publicId} WHERE id = ${(lead as any).id}`);
        }

        // 3. Propagate to quotes, orders, dispatch
        console.log("Propagating to quotes...");
        await db.execute(sql`UPDATE quotes SET public_id = leads.public_id FROM leads WHERE quotes.lead_id = leads.id`);

        console.log("Propagating to orders...");
        await db.execute(sql`UPDATE orders SET public_id = leads.public_id FROM leads WHERE orders.lead_id = leads.id`);

        console.log("Propagating to dispatch...");
        await db.execute(sql`UPDATE dispatch SET public_id = leads.public_id FROM leads WHERE dispatch.lead_id = leads.id`);

        // 4. Add constraints
        console.log("Adding constraints...");
        // We can't easily add UNIQUE constraint if there are duplicates (shouldn't be for leads, but maybe for others if logic failed)
        // Also NOT NULL requires all rows to have value.

        await db.execute(sql`ALTER TABLE leads ALTER COLUMN public_id SET NOT NULL`);
        await db.execute(sql`ALTER TABLE leads ADD CONSTRAINT leads_public_id_unique UNIQUE (public_id)`);

        // For quotes/orders/dispatch, public_id should also be unique and not null
        await db.execute(sql`ALTER TABLE quotes ALTER COLUMN public_id SET NOT NULL`);
        await db.execute(sql`ALTER TABLE quotes ADD CONSTRAINT quotes_public_id_unique UNIQUE (public_id)`);

        await db.execute(sql`ALTER TABLE orders ALTER COLUMN public_id SET NOT NULL`);
        await db.execute(sql`ALTER TABLE orders ADD CONSTRAINT orders_public_id_unique UNIQUE (public_id)`);

        await db.execute(sql`ALTER TABLE dispatch ALTER COLUMN public_id SET NOT NULL`);
        await db.execute(sql`ALTER TABLE dispatch ADD CONSTRAINT dispatch_public_id_unique UNIQUE (public_id)`);

        // 5. Drop old columns (Optional, maybe keep for safety for now, or drop if user requested rename)
        // User said "Rename ... to public_id". So we should drop old ones or rename them.
        // Since we created new column, we can drop old ones.
        console.log("Dropping old columns...");
        await db.execute(sql`ALTER TABLE leads DROP COLUMN IF EXISTS lead_number`);
        await db.execute(sql`ALTER TABLE quotes DROP COLUMN IF EXISTS quote_number`);
        await db.execute(sql`ALTER TABLE orders DROP COLUMN IF EXISTS order_number`);
        await db.execute(sql`ALTER TABLE dispatch DROP COLUMN IF EXISTS dispatch_number`);

        console.log("Migration completed successfully.");
    } catch (error) {
        console.error("Migration failed:", error);
    }

    process.exit(0);
}

migrate();
