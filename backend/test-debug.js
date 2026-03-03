require('dotenv').config();
const http = require('http');

function post(path, body, token) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const req = http.request({
            hostname: 'localhost', port: 5000, path, method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data),
                ...(token ? { Authorization: 'Bearer ' + token } : {})
            }
        }, res => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
                catch { resolve({ status: res.statusCode, raw: body }); }
            });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function run() {
    const login = await post('/api/auth/login', { email: 'test@nextup.ai', password: 'test123' });
    const token = login.data.accessToken;

    const session = await post('/api/interview/start', { mode: 'General', type: 'DSA', difficulty: 'Easy' }, token);
    const sid = session.data.session._id;
    console.log('Session:', sid);

    const q = await post('/api/interview/' + sid + '/question', { topic: 'Arrays' }, token);
    console.log('Status:', q.status);
    console.log('Response:', JSON.stringify(q.data || q.raw, null, 2));
}
run().catch(e => console.error('Error:', e.message));
