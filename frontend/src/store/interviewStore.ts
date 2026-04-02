import { create } from 'zustand';
import api from '@/lib/api';

interface Question {
    title?: string;
    question?: string;
    description?: string;
    examples?: Array<{ input: string; output: string; explanation?: string }>;
    constraints?: string[];
    optimalComplexity?: { time: string; space: string };
    hints?: string[];
    topic?: string;
    isBehavioral?: boolean;
    starterCode?: Record<string, string>;
}

const DEFAULT_STARTERS: Record<string, string> = {
    python: '# Write your solution here\n\ndef solution():\n    pass\n\n# Test\nprint(solution())\n',
    javascript: '// Write your solution here\n\nfunction solution() {\n    return null;\n}\n\n// Test\nconsole.log(solution());\n',
    cpp: '#include <iostream>\nusing namespace std;\n\nint solution() {\n    // Write your solution here\n    return 0;\n}\n\nint main() {\n    cout << solution() << endl;\n    return 0;\n}\n',
    java: 'class Solution {\n    public static Object solve() {\n        // Write your solution here\n        return null;\n    }\n\n    public static void main(String[] args) {\n        System.out.println(solve());\n    }\n}\n',
};

interface Feedback {
    score: number;
    timeComplexity?: string;
    spaceComplexity?: string;
    optimalTimeComplexity?: string;
    optimalSpaceComplexity?: string;
    codeQuality?: number;
    edgeCasesCovered?: number;
    strengths?: string[];
    improvements?: string[];
    detailedFeedback?: string;
    followUpQuestion?: string;
    // Behavioral
    clarity?: number;
    confidence?: number;
    starMethodAdherence?: number;
}

interface Message {
    role: 'ai' | 'user';
    content: string;
    timestamp: Date;
}

interface InterviewStore {
    // Session state
    sessionId: string | null;
    mode: string;
    type: string;
    difficulty: string;
    status: 'idle' | 'active' | 'reviewing' | 'completed';

    // Current question
    currentQuestion: Question | null;
    currentQuestionIndex: number;
    questionStartTime: Date | null;

    // Code editor state
    code: string;
    language: string;
    codeModified: boolean;

    // AI chat
    messages: Message[];
    isAIThinking: boolean;

    // Feedback
    currentFeedback: Feedback | null;
    sessionScore: number;

    // Voice
    isListening: boolean;
    transcript: string;

    // Actions
    startSession: (mode: string, type: string, difficulty: string) => Promise<string>;
    fetchNextQuestion: (topic?: string) => Promise<void>;
    submitAnswer: (textAnswer?: string) => Promise<void>;
    sendMessage: (message: string) => Promise<void>;
    endSession: () => Promise<void>;
    setCode: (code: string) => void;
    setLanguage: (lang: string) => void;
    setListening: (listening: boolean) => void;
    setTranscript: (t: string) => void;
    reset: () => void;
}

const initialState = {
    sessionId: null,
    mode: 'General',
    type: 'DSA',
    difficulty: 'Medium',
    status: 'idle' as const,
    currentQuestion: null,
    currentQuestionIndex: -1,
    questionStartTime: null,
    code: '# Write your solution here\n\ndef solution():\n    pass\n',
    language: 'python',
    codeModified: false,
    messages: [],
    isAIThinking: false,
    currentFeedback: null,
    sessionScore: 0,
    isListening: false,
    transcript: '',
};

export const useInterviewStore = create<InterviewStore>((set, get) => ({
    ...initialState,

    startSession: async (mode, type, difficulty) => {
        const { data } = await api.post('/interview/start', { mode, type, difficulty });
        const sessionId = data.data.sessionId;
        set({ sessionId, mode, type, difficulty, status: 'active', messages: [], sessionScore: 0 });
        return sessionId;
    },

    fetchNextQuestion: async (topic) => {
        const { sessionId } = get();
        if (!sessionId) return;

        set({ isAIThinking: true, currentFeedback: null });
        try {
            const { data } = await api.post(`/interview/${sessionId}/question`, { topic });
            const q = data.data.question;
            const lang = get().language;
            const starterCode = q.starterCode?.[lang] || DEFAULT_STARTERS[lang] || DEFAULT_STARTERS.python;
            set({
                currentQuestion: q,
                currentQuestionIndex: data.data.questionIndex,
                questionStartTime: new Date(),
                isAIThinking: false,
                code: starterCode,
                status: 'active',
            });

            // Add AI message announcing the question
            const questionText = q.question || q.title || 'Here is your question.';
            set(state => ({
                messages: [...state.messages, {
                    role: 'ai',
                    content: `Let's move to the next question.\n\n**${questionText}**\n\nTake your time to think through the approach before coding.`,
                    timestamp: new Date(),
                }],
            }));
        } catch {
            set({ isAIThinking: false });
        }
    },

    submitAnswer: async (textAnswer) => {
        const { sessionId, currentQuestionIndex, code, language, currentQuestion } = get();
        if (!sessionId || currentQuestionIndex < 0) return;

        set({ isAIThinking: true, status: 'reviewing' });
        try {
            const questionText = currentQuestion?.question || currentQuestion?.title || currentQuestion?.description || '';
            const isBehavioral = currentQuestion?.isBehavioral || false;

            const { data } = await api.post(`/interview/${sessionId}/submit`, {
                questionIndex: currentQuestionIndex,
                code,
                language,
                textAnswer,
                questionText,
                isBehavioral,
            });

            const feedback = data.data.feedback;
            set({
                currentFeedback: feedback,
                sessionScore: data.data.sessionScore || 0,
                isAIThinking: false,
            });

            // Add feedback to chat
            set(state => ({
                messages: [...state.messages, {
                    role: 'ai',
                    content: `**Score: ${feedback.score}/100**\n\n${feedback.detailedFeedback}\n\n${feedback.followUpQuestion ? `**Follow-up:** ${feedback.followUpQuestion}` : ''}`,
                    timestamp: new Date(),
                }],
            }));
        } catch {
            set({ isAIThinking: false, status: 'active' });
        }
    },

    sendMessage: async (message) => {
        const { sessionId, currentQuestion } = get();
        if (!sessionId) return;

        set(state => ({
            messages: [...state.messages, { role: 'user', content: message, timestamp: new Date() }],
            isAIThinking: true,
        }));

        try {
            const questionText = currentQuestion?.question || currentQuestion?.title || '';
            const { data } = await api.post(`/interview/${sessionId}/chat`, {
                message,
                questionContext: questionText,
            });

            set(state => ({
                messages: [...state.messages, { role: 'ai', content: data.data.response, timestamp: new Date() }],
                isAIThinking: false,
            }));
        } catch {
            set({ isAIThinking: false });
        }
    },

    endSession: async () => {
        const { sessionId } = get();
        if (!sessionId) return;
        await api.post(`/interview/${sessionId}/end`);
        set({ status: 'completed' });
    },

    setCode: (code) => set({ code, codeModified: true }),
    setLanguage: (language) => {
        const { currentQuestion } = get();
        const starterCode = currentQuestion?.starterCode?.[language] || DEFAULT_STARTERS[language] || DEFAULT_STARTERS.python;
        set({ language, code: starterCode, codeModified: false });
    },
    setListening: (isListening) => set({ isListening }),
    setTranscript: (transcript) => set({ transcript }),
    reset: () => set(initialState),
}));
