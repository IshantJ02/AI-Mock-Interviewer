require('dotenv').config();
const OpenAI = require('openai');

const client = new OpenAI({
    apiKey: process.env.HF_API_KEY,
    baseURL: 'https://router.huggingface.co/v1'
});

async function test() {
    console.log('Testing HF API key:', process.env.HF_API_KEY ? process.env.HF_API_KEY.slice(0, 8) + '...' : 'MISSING');

    // Test 1: Quick model check
    try {
        const r = await client.chat.completions.create({
            model: 'mistralai/Mistral-7B-Instruct-v0.3',
            messages: [{ role: 'user', content: 'Respond with exactly this JSON: {"status":"ok"}' }],
            max_tokens: 30
        });
        console.log('✅ Mistral-7B works:', r.choices[0].message.content.trim());
    } catch (e) {
        console.error('❌ Mistral-7B failed:', e.status, e.message.slice(0, 200));

        // Fallback: try meta-llama
        try {
            const r2 = await client.chat.completions.create({
                model: 'meta-llama/Llama-3.2-3B-Instruct',
                messages: [{ role: 'user', content: 'Respond with exactly this JSON: {"status":"ok"}' }],
                max_tokens: 30
            });
            console.log('✅ Llama-3.2-3B works:', r2.choices[0].message.content.trim());
            console.log('→ Use model: meta-llama/Llama-3.2-3B-Instruct');
        } catch (e2) {
            console.error('❌ Llama-3.2-3B also failed:', e2.status, e2.message.slice(0, 200));
        }
    }

    // Test 2: Full question generation
    const { generateQuestion } = require('./src/services/aiService');
    const start = Date.now();
    try {
        const q = await generateQuestion({ topic: 'Arrays', difficulty: 'Easy', companyMode: 'General' });
        console.log('✅ generateQuestion in', Date.now() - start, 'ms');
        console.log('   Title:', q.title);
        console.log('   Tags:', (q.tags || []).join(', '));
    } catch (e) {
        console.error('❌ generateQuestion failed:', e.message.slice(0, 200));
    }
}

test();
