require('dotenv').config();
const OpenAI = require('openai');

const client = new OpenAI({
    apiKey: process.env.HF_API_KEY,
    baseURL: 'https://router.huggingface.co/v1'
});

// Try models known to work on HF router chat completions
const MODELS_TO_TRY = [
    'Qwen/Qwen2.5-7B-Instruct',
    'Qwen/Qwen2.5-14B-Instruct',
    'meta-llama/Llama-3.1-8B-Instruct',
    'meta-llama/Meta-Llama-3-8B-Instruct',
    'microsoft/Phi-3.5-mini-instruct',
    'google/gemma-2-9b-it',
];

async function testModel(model) {
    const start = Date.now();
    try {
        const r = await client.chat.completions.create({
            model,
            messages: [{ role: 'user', content: 'Respond with exactly this JSON and nothing else: {"status":"ok"}' }],
            max_tokens: 30
        });
        const ms = Date.now() - start;
        const content = r.choices[0].message.content.trim();
        console.log(`✅ ${model} — ${ms}ms — ${content.slice(0, 60)}`);
        return { model, ok: true, ms };
    } catch (e) {
        console.log(`❌ ${model} — ${e.status || 'ERR'}: ${e.message.slice(0, 80)}`);
        return { model, ok: false };
    }
}

async function run() {
    console.log('HF Key:', process.env.HF_API_KEY ? process.env.HF_API_KEY.slice(0, 12) + '...' : 'MISSING');
    console.log('Testing models on router.huggingface.co/v1...\n');
    const results = [];
    for (const m of MODELS_TO_TRY) {
        const r = await testModel(m);
        results.push(r);
        if (r.ok) break; // stop at first working model
    }
    const winner = results.find(r => r.ok);
    if (winner) {
        console.log('\n🏆 Use this model in aiService.js:', winner.model);
    } else {
        console.log('\n⚠️  No models worked. Check your HF key permissions.');
    }
}
run();
