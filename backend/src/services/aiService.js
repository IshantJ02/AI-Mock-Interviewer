const OpenAI = require('openai');

// ── Hugging Face Inference API (OpenAI-compatible endpoint) ───────────────
// Uses the same openai SDK, just pointed at HF's router
if (!process.env.HF_API_KEY) {
    console.error('\n⚠️  WARNING: HF_API_KEY is not set in .env file!');
    console.error('   AI features (question generation, evaluation, chat) will NOT work.');
    console.error('   Create a backend/.env file with: HF_API_KEY=hf_your_key_here\n');
}

const openai = new OpenAI({
    apiKey: process.env.HF_API_KEY || 'missing-key',
    baseURL: 'https://router.huggingface.co/v1',
    timeout: 30000,       // 30s timeout to prevent hanging forever
    maxRetries: 1,        // Only retry once on failure
});

// Confirmed working on HF router — fast, reliable, excellent JSON structured output
const MODEL = 'Qwen/Qwen2.5-7B-Instruct';

/**
 * Company mode personality configurations
 * Changes the AI interviewer's style based on target company
 */
const COMPANY_PERSONALITIES = {
    Google: {
        name: 'Google',
        style: 'Google-style',
        focus: 'optimal algorithms, edge cases, Big-O analysis, and elegant code',
        personality: 'systematic, thorough, and analytically rigorous',
        traits: 'You push candidates to optimize their solution, explore edge cases deeply, and justify their algorithmic choices mathematically.',
        difficulty_boost: 1.2,
    },
    Amazon: {
        name: 'Amazon',
        style: 'Amazon-style',
        focus: 'scalability, leadership principles, practical system design, and real-world impact',
        personality: 'pragmatic, customer-obsessed, and results-oriented',
        traits: 'You ask about scalability implications, tie solutions to real-world impact, and weave in leadership principle questions.',
        difficulty_boost: 1.0,
    },
    Meta: {
        name: 'Meta',
        style: 'Meta-style',
        focus: 'product thinking, data structures mastery, and social scale considerations',
        personality: 'product-minded, fast-paced, and innovation-focused',
        traits: 'You evaluate both coding ability and product intuition, asking how solutions scale to billions of users.',
        difficulty_boost: 1.1,
    },
    Startup: {
        name: 'Startup',
        style: 'Startup-style',
        focus: 'practical solutions, ship speed, pragmatic trade-offs, and product thinking',
        personality: 'scrappy, practical, and entrepreneurially minded',
        traits: 'You value speed of implementation over perfection, ask about trade-offs, and assess whether the candidate can wear multiple hats.',
        difficulty_boost: 0.9,
    },
    General: {
        name: 'General',
        style: 'standard',
        focus: 'core computer science fundamentals and clean code',
        personality: 'friendly, supportive, and educational',
        traits: 'You provide clear hints when candidates are stuck and focus on helping them learn.',
        difficulty_boost: 1.0,
    },
};

/**
 * Helper: extract valid JSON from model output.
 * HF models sometimes wrap JSON in markdown code fences — this strips them.
 */
const extractJSON = (text) => {
    // Remove markdown code fences if present
    const cleaned = text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

    // Find the first { ... } block
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('No JSON object found in response');
    return JSON.parse(cleaned.slice(start, end + 1));
};

/**
 * Generate a DSA interview question using AI
 */
const generateQuestion = async ({ topic, difficulty, companyMode = 'General', previousTopics = [] }) => {
    const company = COMPANY_PERSONALITIES[companyMode] || COMPANY_PERSONALITIES.General;

    const prompt = `You are an expert ${company.style} technical interviewer. Generate a unique DSA coding problem.

Company Mode: ${company.name}
Focus: ${company.focus}
Topic: ${topic}
Difficulty: ${difficulty}
Previously asked topics (avoid repeating): ${previousTopics.join(', ') || 'None'}

IMPORTANT: Include "starterCode" with LeetCode-style function stubs for each language.
Each stub MUST include:
- The function signature with correct parameter names and types
- A comment saying "Write your solution here"
- A return placeholder (pass / return null / return 0 / etc.)
- A small test driver that calls the function with the first example and prints the result

Respond ONLY with valid JSON (no markdown, no extra text):
{
  "title": "Problem title",
  "description": "Full problem description with context",
  "examples": [
    {"input": "example input", "output": "expected output", "explanation": "explanation"},
    {"input": "example input 2", "output": "expected output 2", "explanation": "explanation"}
  ],
  "constraints": ["constraint 1", "constraint 2"],
  "optimalComplexity": {"time": "O(?)", "space": "O(?)"},
  "hints": ["hint 1", "hint 2"],
  "tags": ["tag1", "tag2"],
  "topic": "${topic}",
  "starterCode": {
    "python": "def func_name(params):\\n    # Write your solution here\\n    pass\\n\\n# Test\\nprint(func_name(example_args))",
    "javascript": "function funcName(params) {\\n    // Write your solution here\\n    return null;\\n}\\n\\n// Test\\nconsole.log(funcName(exampleArgs));",
    "cpp": "#include <iostream>\\n#include <vector>\\nusing namespace std;\\n\\nreturnType funcName(params) {\\n    // Write your solution here\\n    return {};\\n}\\n\\nint main() {\\n    cout << funcName(exampleArgs) << endl;\\n    return 0;\\n}",
    "java": "import java.util.*;\\n\\nclass Solution {\\n    public static returnType funcName(params) {\\n        // Write your solution here\\n        return null;\\n    }\\n\\n    public static void main(String[] args) {\\n        System.out.println(funcName(exampleArgs));\\n    }\\n}"
  }
}`;

    try {
        const response = await openai.chat.completions.create({
            model: MODEL,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.8,
            max_tokens: 2000,
        });

        return extractJSON(response.choices[0].message.content);
    } catch (error) {
        console.error('generateQuestion AI error:', error.message);
        throw new Error(`AI question generation failed: ${error.message}`);
    }
};

/**
 * Evaluate submitted code solution
 */
const evaluateCode = async ({ question, code, language, companyMode = 'General' }) => {
    const company = COMPANY_PERSONALITIES[companyMode] || COMPANY_PERSONALITIES.General;

    const prompt = `You are a ${company.style} technical interviewer evaluating a coding solution.
Your personality: ${company.personality}
${company.traits}

PROBLEM:
${question}

SUBMITTED CODE (${language}):
\`\`\`${language}
${code}
\`\`\`

Evaluate this solution comprehensively. Respond ONLY with valid JSON (no markdown, no extra text):
{
  "score": <0-100>,
  "timeComplexity": "O(?)",
  "spaceComplexity": "O(?)",
  "optimalTimeComplexity": "O(?)",
  "optimalSpaceComplexity": "O(?)",
  "codeQuality": <0-100>,
  "edgeCasesCovered": <0-100>,
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2"],
  "detailedFeedback": "Comprehensive paragraph feedback as the interviewer",
  "suggestedOptimization": "Brief description of optimal approach if not already optimal",
  "followUpQuestion": "A follow-up question to probe deeper understanding"
}`;

    try {
        const response = await openai.chat.completions.create({
            model: MODEL,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 800,
        });

        return extractJSON(response.choices[0].message.content);
    } catch (error) {
        console.error('evaluateCode AI error:', error.message);
        throw new Error(`AI evaluation failed: ${error.message}`);
    }
};

/**
 * Evaluate behavioral answer using STAR method
 */
const evaluateBehavioral = async ({ question, answer, companyMode = 'General' }) => {
    const company = COMPANY_PERSONALITIES[companyMode] || COMPANY_PERSONALITIES.General;

    const prompt = `You are a ${company.style} HR interviewer evaluating a behavioral answer.

QUESTION: ${question}
CANDIDATE'S ANSWER: ${answer}

Evaluate using the STAR method (Situation, Task, Action, Result).
Respond ONLY with valid JSON (no markdown, no extra text):
{
  "score": <0-100>,
  "clarity": <0-100>,
  "confidence": <0-100>,
  "starMethodAdherence": <0-100>,
  "relevance": <0-100>,
  "detailedFeedback": "Comprehensive feedback as the interviewer",
  "starBreakdown": {
    "situation": "What was mentioned about the situation",
    "task": "What was mentioned about the task",
    "action": "What actions were described",
    "result": "What results were mentioned"
  },
  "followUpQuestion": "A follow-up question to dig deeper"
}`;

    try {
        const response = await openai.chat.completions.create({
            model: MODEL,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 700,
        });

        return extractJSON(response.choices[0].message.content);
    } catch (error) {
        console.error('evaluateBehavioral AI error:', error.message);
        throw new Error(`AI behavioral evaluation failed: ${error.message}`);
    }
};

/**
 * Generate a behavioral/HR question
 */
const generateBehavioralQuestion = async ({ companyMode = 'General', previousQuestions = [] }) => {
    const company = COMPANY_PERSONALITIES[companyMode] || COMPANY_PERSONALITIES.General;

    const prompt = `You are a ${company.style} HR interviewer. Generate a behavioral interview question.
Focus: ${company.focus}
Previously asked (avoid repeating): ${previousQuestions.join(', ') || 'None'}

Respond ONLY with valid JSON (no markdown, no extra text):
{
  "question": "The behavioral question",
  "category": "Leadership|Conflict|Achievement|Failure|Teamwork|Innovation",
  "whatWeAssess": "What this question evaluates",
  "idealAnswerHints": ["hint 1", "hint 2"]
}`;

    try {
        const response = await openai.chat.completions.create({
            model: MODEL,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.8,
            max_tokens: 400,
        });

        return extractJSON(response.choices[0].message.content);
    } catch (error) {
        console.error('generateBehavioralQuestion AI error:', error.message);
        throw new Error(`AI behavioral question generation failed: ${error.message}`);
    }
};

/**
 * Chat with AI interviewer - handles follow-up conversation
 */
const chatWithInterviewer = async ({ messages, companyMode = 'General', context = '' }) => {
    const company = COMPANY_PERSONALITIES[companyMode] || COMPANY_PERSONALITIES.General;

    const systemPrompt = `You are an expert ${company.style} technical interviewer.
Personality: ${company.personality}
${company.traits}

Context: ${context}

You are conducting a live interview. Stay in character. Ask probing follow-up questions,
provide hints if asked, and guide the candidate through the problem. Keep responses concise (2-4 sentences max).`;

    try {
        const response = await openai.chat.completions.create({
            model: MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                ...messages,
            ],
            temperature: 0.7,
            max_tokens: 300,
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error('chatWithInterviewer AI error:', error.message);
        throw new Error(`AI chat failed: ${error.message}`);
    }
};

/**
 * Analyze code complexity in real-time
 */
const analyzeComplexity = async ({ code, language }) => {
    const prompt = `Analyze this ${language} code and provide complexity analysis.

CODE:
\`\`\`${language}
${code}
\`\`\`

Respond ONLY with valid JSON (no markdown, no extra text):
{
  "timeComplexity": "O(?)",
  "spaceComplexity": "O(?)",
  "explanation": "Brief explanation of why",
  "patterns": ["nested loops", "recursion"],
  "suggestions": ["optimization suggestion 1"]
}`;

    try {
        const response = await openai.chat.completions.create({
            model: MODEL,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.1,
            max_tokens: 400,
        });

        return extractJSON(response.choices[0].message.content);
    } catch (error) {
        console.error('analyzeComplexity AI error:', error.message);
        throw new Error(`AI complexity analysis failed: ${error.message}`);
    }
};

module.exports = {
    generateQuestion,
    evaluateCode,
    evaluateBehavioral,
    generateBehavioralQuestion,
    chatWithInterviewer,
    analyzeComplexity,
    COMPANY_PERSONALITIES,
};
