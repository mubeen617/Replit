// Quick test to create a customer and see the error
const testCustomer = {
    name: "Test Company",
    domain: "testcompany999.com",
    admin_name: "Test Admin",
    admin_email: "admin@testcompany999.com",
    admin_password: "password123",
    status: "active"
};

fetch('http://localhost:5000/api/customers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testCustomer)
})
    .then(async res => {
        const text = await res.text();
        console.log('Status:', res.status);
        console.log('Response:', text);
    })
    .catch(err => console.error('Error:', err));
