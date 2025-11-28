
import 'dotenv/config';

const BASE_URL = 'http://localhost:5000';
const CUSTOMER_ID = '99a8c5db-44da-4022-934f-b22e6336fc58'; // From previous step

async function testFlow() {
    console.log('Starting verification flow...');

    // 1. Create Lead
    console.log('Creating Lead...');
    const leadRes = await fetch(`${BASE_URL}/api/crm/leads/${CUSTOMER_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contact_name: 'Test Person',
            contact_phone: '1234567890',
            origin: '123 Test St',
            destination: '456 Dest St',
            pickup_date: new Date().toISOString(),
            status: 'lead'
        })
    });

    if (!leadRes.ok) {
        console.error('Failed to create lead:', await leadRes.text());
        process.exit(1);
    }

    const lead = await leadRes.json();
    console.log('Lead created:', lead);

    if (!lead.public_id || !/^\d{10}$/.test(lead.public_id)) {
        console.error('Invalid public_id format:', lead.public_id);
        // process.exit(1); // Don't exit yet, check if it propagates
    } else {
        console.log('Lead public_id format is correct:', lead.public_id);
    }

    const publicId = lead.public_id;

    // 2. Convert to Quote
    console.log('Converting to Quote...');
    const quoteRes = await fetch(`${BASE_URL}/api/crm/leads/${CUSTOMER_ID}/${lead.id}/convert-to-quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            carrier_fees: '100',
            broker_fees: '50',
            total_tariff: '150',
            pickup_person_name: 'Test Person',
            pickup_person_phone: '1234567890',
            pickup_address: '123 Test St',
            dropoff_person_name: 'Dest Person',
            dropoff_person_phone: '0987654321',
            dropoff_address: '456 Dest St'
        })
    });

    if (!quoteRes.ok) {
        console.error('Failed to convert to quote:', await quoteRes.text());
        process.exit(1);
    }

    const quote = await quoteRes.json();
    console.log('Quote created:', quote);

    if (quote.public_id !== publicId) {
        console.error(`Quote public_id mismatch! Expected ${publicId}, got ${quote.public_id}`);
    } else {
        console.log('Quote public_id matches.');
    }

    // 3. Convert to Order
    console.log('Converting to Order...');
    // Note: Quote needs to be accepted? Or endpoint handles it?
    // The endpoint is POST /api/crm/quotes/:quoteId/convert-to-order
    // Usually this endpoint updates status to accepted and creates order.

    const orderRes = await fetch(`${BASE_URL}/api/crm/quotes/${quote.id}/convert-to-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    });

    if (!orderRes.ok) {
        console.error('Failed to convert to order:', await orderRes.text());
        process.exit(1);
    }

    const order = await orderRes.json();
    console.log('Order created:', order);

    if (order.public_id !== publicId) {
        console.error(`Order public_id mismatch! Expected ${publicId}, got ${order.public_id}`);
    } else {
        console.log('Order public_id matches.');
    }

    console.log('Verification flow completed successfully.');
}

testFlow().catch(console.error);
