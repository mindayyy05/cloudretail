
// using native fetch

const PRODUCT_API = 'http://localhost:4002/api/v1/products';
const ADMIN_API = 'http://localhost:4002/api/v1/products'; // same

async function verify() {
    try {
        console.log('1. Creating product with brand...');
        const product = {
            name: 'Brand Test Shoe',
            description: 'Testing brand field',
            price: 50.00,
            category: 'Sports',
            brand: 'NikeTest',
            image_url: 'http://example.com/shoe.jpg'
        };

        const res = await fetch(PRODUCT_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product)
        });

        if (res.status !== 201) {
            console.error('Failed to create product:', res.status, await res.text());
            return;
        }

        const created = await res.json();
        console.log('Product Created:', created.id, created.name, created.brand);

        if (created.brand !== 'NikeTest') {
            console.error('Brand mismatch! Expected NikeTest, got:', created.brand);
        } else {
            console.log('Brand persistence VERIFIED.');
        }

        console.log('2. Fetching product list to check brand field...');
        const listRes = await fetch(PRODUCT_API);
        const list = await listRes.json();
        const found = list.find(p => p.id === created.id);

        if (found && found.brand === 'NikeTest') {
            console.log('Brand field present in list: VERIFIED');
        } else {
            console.error('Brand missing in list:', found);
        }

    } catch (e) {
        console.error('Error:', e);
    }
}

verify();
