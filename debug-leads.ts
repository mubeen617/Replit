
import { supabaseAdmin } from "./server/supabase";

async function debugLeads() {
    console.log("Fetching all leads...");
    const { data: leads, error } = await supabaseAdmin
        .from('leads')
        .select('id, lead_number, status, contact_name');

    if (error) {
        console.error("Error fetching leads:", error);
        return;
    }

    console.log("Leads found:", leads.length);
    leads.forEach(lead => {
        console.log(`Lead: ${lead.lead_number}, Status: ${lead.status}, Name: ${lead.contact_name}`);
    });
}

debugLeads();
