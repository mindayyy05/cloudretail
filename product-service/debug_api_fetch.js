async function checkApi() {
    try {
        const res = await fetch('http://localhost:4002/api/v1/products');
        const data = await res.json();
        console.log('API Response Status:', res.status);
        console.log('Products found:', data.length);
        if (data.length > 0) console.log(data[0]);
    } catch (err) {
        console.error('Fetch failed:', err.message);
    }
}

checkApi();
