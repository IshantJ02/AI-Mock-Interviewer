require('dotenv').config();
const http = require('http');

function post(path, body, token) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const options = {
            hostname: 'localhost', port: 5000,
            path, method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data),
                ...(token ? { Authorization: 'Bearer ' + token } : {})
            }
        };
        const req = http.request(options, res => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => {
                try { resolve(JSON.parse(body)); }
                catch { resolve({ raw: body }); }
            });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function run() {
    console.log('\n============ NextUp.ai — Full API Test ============\n');

    // 1. Login
    const t0 = Date.now();
    const login = await post('/api/auth/login', { email: 'test@nextup.ai', password: 'test123' });
    if (!login.success) { console.error('❌ Login failed:', login.message); return; }
    const token = login.data.accessToken;
    console.log('✅ Login OK  —', Date.now() - t0, 'ms');
    console.log('   User:', login.data.user.name);

    // 2. Start session
    const t1 = Date.now();
    const session = await post('/api/interview/start', { mode: 'Google', type: 'DSA', difficulty: 'Medium' }, token);
    if (!session.success) { console.error('❌ Start session failed:', session.message); return; }
    const sid = session.data.session._id;
    console.log('✅ Session started —', Date.now() - t1, 'ms  ID:', sid);

    // 3. Get AI question
    const t2 = Date.now();
    const q = await post('/api/interview/' + sid + '/question', { topic: 'Arrays' }, token);
    if (!q.success) { console.error('❌ Question failed:', q.message); return; }
    const question = q.data.question;
    console.log('✅ AI Question generated —', Date.now() - t2, 'ms');
    console.log('   Title:', question.title);
    console.log('   Tags:', (question.tags || []).join(', '));
    console.log('   Hints:', (question.hints || []).length, 'hints');
    console.log('   Time complexity:', question.optimalComplexity?.time);

    // 4. Chat with AI interviewer
    const t3 = Date.now();
    const chat = await post('/api/interview/' + sid + '/chat', {
        message: 'Can you give me a hint for this problem?',
        questionContext: question.title
    }, token);
    if (!chat.success) { console.error('❌ Chat failed:', chat.message); return; }
    console.log('✅ AI Chat response —', Date.now() - t3, 'ms');
    console.log('  ', chat.data.response.slice(0, 150) + '...');

    console.log('\n🎉 All systems operational! NextUp.ai backend is fully working with HF AI.\n');
}

run().catch(e => console.error('Fatal:', e.message));
