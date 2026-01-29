
// using native fetch
const AUTH_URL = 'http://localhost:4001/api/v1/auth/login';

async function verify() {
    try {
        const res = await fetch(AUTH_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@cloudretail.com', password: 'admin123' })
        });

        if (res.status === 200) {
            const data = await res.json();
            console.log('Login Successful!');
            console.log('Token:', data.token ? 'Present' : 'Missing');
            console.log('User Role:', data.user.role);
        } else {
            console.log('Login Failed:', res.status);
            console.log(await res.text());
        }
    } catch (e) {
        console.error('Error:', e);
    }
}
verify();
