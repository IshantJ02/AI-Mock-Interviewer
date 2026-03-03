'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useInterviewStore } from '@/store/interviewStore';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import api from '@/lib/api';
import {
    Brain, Mic, MicOff, Send, Code2, Play,
    ChevronRight, RotateCcw, CheckCircle2, XCircle,
    Volume2, MessageSquare, Timer, Trophy,
    Zap, BarChart2, ArrowRight, Loader2, Sparkles
} from 'lucide-react';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

const MODES = ['General', 'Google', 'Amazon', 'Meta', 'Startup'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const LANGUAGES = ['python', 'javascript', 'cpp', 'java'];
const TOPICS_LIST = [
    'Arrays', 'Strings', 'Linked Lists', 'Trees', 'Graphs',
    'Dynamic Programming', 'Recursion', 'Sliding Window',
    'Two Pointers', 'Binary Search', 'Sorting', 'Hash Maps',
    'Heaps', 'Backtracking', 'Greedy'
];

const MODE_COLORS: Record<string, string> = {
    General: 'from-purple-500 to-blue-500',
    Google: 'from-blue-500 to-green-400',
    Amazon: 'from-orange-500 to-yellow-400',
    Meta: 'from-blue-600 to-purple-500',
    Startup: 'from-pink-500 to-rose-400',
};

export default function InterviewPage() {
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();
    const {
        sessionId, status, mode, difficulty, type, currentQuestion,
        code, language, messages, isAIThinking, currentFeedback, sessionScore,
        isListening, transcript,
        startSession, fetchNextQuestion, submitAnswer, sendMessage, endSession,
        setCode, setLanguage, setListening, setTranscript, reset
    } = useInterviewStore();

    const [selectedMode, setSelectedMode] = useState('General');
    const [selectedDifficulty, setSelectedDifficulty] = useState('Medium');
    const [selectedType, setSelectedType] = useState('DSA');
    const [selectedTopic, setSelectedTopic] = useState('');
    const [chatInput, setChatInput] = useState('');
    const [executionResult, setExecutionResult] = useState<{ output?: string; error?: string; executionTime?: number; simulated?: boolean } | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [activeTab, setActiveTab] = useState<'problem' | 'feedback'>('problem');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<NodeJS.Timeout>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if (!isAuthenticated) router.push('/login');
    }, [isAuthenticated, router]);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    // Timer
    useEffect(() => {
        if (status === 'active') {
            timerRef.current = setInterval(() => setElapsedTime(t => t + 1), 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [status]);

    const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    const handleStart = async () => {
        try {
            reset();
            setElapsedTime(0);
            await startSession(selectedMode, selectedType, selectedDifficulty);
            await fetchNextQuestion(selectedTopic || undefined);
            toast.success(`${selectedMode} Interview started! Good luck! 🎯`);
        } catch {
            toast.error('Failed to start interview. Check API key and backend.');
        }
    };

    const handleRunCode = async () => {
        if (!code.trim()) { toast.error('Write some code first!'); return; }
        setIsRunning(true);
        try {
            const { data } = await api.post('/interview/execute', { code, language });
            setExecutionResult(data.data);
            if (data.data.simulated) toast('Running in simulation mode (Docker not available)', { icon: 'ℹ️' });
        } catch { toast.error('Execution failed'); }
        finally { setIsRunning(false); }
    };

    const handleSubmit = async () => {
        try {
            await submitAnswer();
            setActiveTab('feedback');
            toast.success('Answer submitted! Check feedback →');
        } catch { toast.error('Submission failed'); }
    };

    const handleNextQuestion = async () => {
        setExecutionResult(null);
        setActiveTab('problem');
        await fetchNextQuestion(selectedTopic || undefined);
    };

    const handleEndSession = async () => {
        await endSession();
        toast.success(`Interview Complete! Final Score: ${sessionScore}/100 🏆`);
    };

    const handleChat = async () => {
        if (!chatInput.trim() || isAIThinking) return;
        const msg = chatInput;
        setChatInput('');
        await sendMessage(msg);
    };

    // Voice recognition
    const toggleVoice = () => {
        if (typeof window === 'undefined') return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SR) { toast.error('Voice not supported in this browser'); return; }

        if (isListening) {
            recognitionRef.current?.stop();
            setListening(false);
        } else {
            const recognition = new SR();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            recognition.onresult = (e: any) => {
                const t = Array.from(e.results as any[]).map((r: any) => r[0].transcript).join('');
                setTranscript(t);
                setChatInput(t);
            };
            recognition.onend = () => setListening(false);

            recognition.start();
            recognitionRef.current = recognition;
            setListening(true);
            toast.success('Listening... speak your answer');
        }
    };

    // ── SETUP SCREEN ─────────────────────────────────────────────────
    if (status === 'idle') {
        return (
            <main className="min-h-screen bg-gray-950 pt-24 px-4 pb-12 relative overflow-hidden">
                <div className="absolute inset-0 dot-bg opacity-10" />
                <div className="blob w-64 h-64 bg-purple-700 top-20 right-20 opacity-20" />

                <div className="max-w-4xl mx-auto relative z-10">
                    <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
                        <h1 className="text-5xl font-black mb-4">
                            <span className="gradient-text">Configure</span>
                            <span className="text-white"> Your Interview</span>
                        </h1>
                        <p className="text-gray-400">Customize your AI interview experience</p>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="glass rounded-3xl p-8 space-y-8">

                        {/* Company Mode */}
                        <div>
                            <label className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                                <Brain size={16} className="text-purple-400" /> Company Mode
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                {MODES.map(m => (
                                    <button
                                        key={m}
                                        onClick={() => setSelectedMode(m)}
                                        className={`py-3 rounded-2xl text-sm font-semibold transition-all ${selectedMode === m
                                            ? `bg-gradient-to-r ${MODE_COLORS[m]} text-white shadow-lg`
                                            : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                            }`}
                                    >
                                        {m === 'Google' ? '🔍' : m === 'Amazon' ? '📦' : m === 'Meta' ? '⚡' : m === 'Startup' ? '🚀' : '🎯'} {m}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Type */}
                        <div>
                            <label className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                                <Code2 size={16} className="text-cyan-400" /> Interview Type
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                {['DSA', 'Behavioral', 'Mixed'].map(t => (
                                    <button key={t} onClick={() => setSelectedType(t)}
                                        className={`py-3 rounded-2xl text-sm font-semibold transition-all ${selectedType === t ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}>
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Difficulty */}
                        <div>
                            <label className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                                <Zap size={16} className="text-yellow-400" /> Difficulty
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                {DIFFICULTIES.map(d => (
                                    <button key={d} onClick={() => setSelectedDifficulty(d)}
                                        className={`py-3 rounded-2xl text-sm font-semibold transition-all ${selectedDifficulty === d
                                            ? d === 'Easy' ? 'bg-green-500/20 text-green-300 border border-green-500/40'
                                                : d === 'Medium' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                                                    : 'bg-red-500/20 text-red-300 border border-red-500/40'
                                            : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}>
                                        {d === 'Easy' ? '🟢' : d === 'Medium' ? '🟡' : '🔴'} {d}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Topic (optional) */}
                        {selectedType !== 'Behavioral' && (
                            <div>
                                <label className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                                    <BarChart2 size={16} className="text-orange-400" /> Topic Focus <span className="text-gray-500 font-normal">(optional)</span>
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    <button onClick={() => setSelectedTopic('')}
                                        className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${!selectedTopic ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-white/5 text-gray-500 hover:text-gray-300'}`}>
                                        Auto (based on weaknesses)
                                    </button>
                                    {TOPICS_LIST.map(t => (
                                        <button key={t} onClick={() => setSelectedTopic(t)}
                                            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${selectedTopic === t ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-white/5 text-gray-500 hover:text-gray-300'}`}>
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Start */}
                        <button onClick={handleStart}
                            className="w-full flex items-center justify-center gap-3 py-5 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-2xl text-white font-bold text-xl hover:scale-[1.02] transition-all glow-purple">
                            <Sparkles size={22} />
                            Start AI Interview
                            <ArrowRight size={20} />
                        </button>
                    </motion.div>
                </div>
            </main>
        );
    }

    // ── COMPLETED SCREEN ────────────────────────────────────────────
    if (status === 'completed') {
        return (
            <main className="min-h-screen bg-gray-950 pt-24 px-4 pb-12 flex items-center justify-center">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg w-full text-center">
                    <div className="glass rounded-3xl p-10 border border-purple-500/20">
                        <div className="text-6xl mb-6">🏆</div>
                        <h2 className="text-4xl font-black gradient-text mb-2">Interview Complete!</h2>
                        <p className="text-gray-400 mb-8">Great job pushing through. Here&apos;s your performance summary.</p>

                        {/* Score Ring */}
                        <div className="relative w-36 h-36 mx-auto mb-8">
                            <svg className="w-full h-full score-ring" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(139,92,246,0.1)" strokeWidth="8" />
                                <circle cx="50" cy="50" r="40" fill="none"
                                    stroke="url(#scoreGrad)" strokeWidth="8" strokeLinecap="round"
                                    strokeDasharray={`${2 * Math.PI * 40}`}
                                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - sessionScore / 100)}`}
                                />
                                <defs>
                                    <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#8b5cf6" />
                                        <stop offset="100%" stopColor="#06b6d4" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-black gradient-text">{sessionScore}</span>
                                <span className="text-xs text-gray-400">/100</span>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button onClick={() => { reset(); }}
                                className="flex-1 py-3 glass rounded-2xl text-gray-300 hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-2">
                                <RotateCcw size={16} /> Try Again
                            </button>
                            <button onClick={() => router.push('/dashboard')}
                                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-2xl text-white font-semibold flex items-center justify-center gap-2">
                                <Trophy size={16} /> Dashboard
                            </button>
                        </div>
                    </div>
                </motion.div>
            </main>
        );
    }

    // ── ACTIVE INTERVIEW SCREEN ────────────────────────────────────
    return (
        <main className="h-screen bg-gray-950 flex flex-col overflow-hidden">
            {/* Top Bar */}
            <div className="flex items-center justify-between px-4 py-3 glass border-b border-white/5 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 rounded-lg bg-gradient-to-r ${MODE_COLORS[mode]} text-white text-xs font-bold`}>
                        {mode}
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${difficulty === 'Easy' ? 'text-green-400 bg-green-500/10' : difficulty === 'Medium' ? 'text-yellow-400 bg-yellow-500/10' : 'text-red-400 bg-red-500/10'}`}>
                        {difficulty}
                    </span>
                    <span className="text-gray-500 text-xs">{type}</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm font-mono">
                        <Timer size={14} className="text-purple-400" />
                        <span className={elapsedTime > 1800 ? 'text-red-400' : 'text-gray-300'}>{formatTime(elapsedTime)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <Trophy size={14} className="text-yellow-400" />
                        <span className="gradient-text font-bold">{sessionScore}/100</span>
                    </div>
                    <button onClick={handleEndSession}
                        className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 text-xs font-semibold transition-all">
                        End Interview
                    </button>
                </div>
            </div>

            {/* Main Layout */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: Problem + Feedback */}
                <div className="w-[42%] flex flex-col border-r border-white/5 overflow-hidden">
                    {/* Tabs */}
                    <div className="flex border-b border-white/5 flex-shrink-0">
                        {['problem', 'feedback'].map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab as 'problem' | 'feedback')}
                                className={`flex-1 py-3 text-xs font-semibold capitalize transition-all ${activeTab === tab ? 'text-purple-400 border-b-2 border-purple-500' : 'text-gray-500 hover:text-gray-300'}`}>
                                {tab === 'problem' ? '📋 Problem' : '📊 AI Feedback'}
                                {tab === 'feedback' && currentFeedback && (
                                    <span className="ml-2 px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px]">{currentFeedback.score}</span>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto p-5">
                        <AnimatePresence mode="wait">
                            {activeTab === 'problem' ? (
                                <motion.div key="problem" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    {currentQuestion ? (
                                        <div className="space-y-4">
                                            <h2 className="text-xl font-black text-white leading-tight">
                                                {currentQuestion.title || currentQuestion.question}
                                            </h2>
                                            {currentQuestion.description && (
                                                <p className="text-gray-300 text-sm leading-relaxed">{currentQuestion.description}</p>
                                            )}
                                            {currentQuestion.examples && currentQuestion.examples.length > 0 && (
                                                <div className="space-y-2">
                                                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Examples</h4>
                                                    {currentQuestion.examples.slice(0, 2).map((ex, i) => (
                                                        <div key={i} className="bg-black/30 rounded-xl p-3 border border-white/5 font-mono text-xs">
                                                            <div><span className="text-gray-500">Input:</span> <span className="text-green-300">{ex.input}</span></div>
                                                            <div><span className="text-gray-500">Output:</span> <span className="text-blue-300">{ex.output}</span></div>
                                                            {ex.explanation && <div className="text-gray-400 mt-1">{ex.explanation}</div>}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {currentQuestion.constraints && currentQuestion.constraints.length > 0 && (
                                                <div>
                                                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Constraints</h4>
                                                    {currentQuestion.constraints.map((c, i) => (
                                                        <div key={i} className="text-xs text-gray-400 font-mono">• {c}</div>
                                                    ))}
                                                </div>
                                            )}
                                            {currentQuestion.hints && currentQuestion.hints.length > 0 && (
                                                <details className="group">
                                                    <summary className="text-xs text-purple-400 cursor-pointer hover:text-purple-300 font-semibold">💡 Hints (click to reveal)</summary>
                                                    <div className="mt-2 space-y-1">
                                                        {currentQuestion.hints.map((h, i) => (
                                                            <div key={i} className="text-xs text-gray-400 bg-purple-500/5 rounded-lg p-2">Hint {i + 1}: {h}</div>
                                                        ))}
                                                    </div>
                                                </details>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center h-40">
                                            <Loader2 size={24} className="text-purple-400 animate-spin" />
                                        </div>
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div key="feedback" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    {currentFeedback ? (
                                        <div className="space-y-4">
                                            {/* Score */}
                                            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-2xl border border-purple-500/20">
                                                <span className="font-semibold text-white">Overall Score</span>
                                                <span className="text-3xl font-black gradient-text">{currentFeedback.score}<span className="text-base text-gray-400">/100</span></span>
                                            </div>

                                            {/* Complexity */}
                                            {currentFeedback.timeComplexity && (
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="bg-black/20 rounded-xl p-3 text-center">
                                                        <div className="text-xs text-gray-400 mb-1">Your Time</div>
                                                        <div className="font-mono text-purple-300 font-bold">{currentFeedback.timeComplexity}</div>
                                                    </div>
                                                    <div className="bg-black/20 rounded-xl p-3 text-center">
                                                        <div className="text-xs text-gray-400 mb-1">Optimal Time</div>
                                                        <div className="font-mono text-green-300 font-bold">{currentFeedback.optimalTimeComplexity}</div>
                                                    </div>
                                                    <div className="bg-black/20 rounded-xl p-3 text-center">
                                                        <div className="text-xs text-gray-400 mb-1">Your Space</div>
                                                        <div className="font-mono text-purple-300 font-bold">{currentFeedback.spaceComplexity}</div>
                                                    </div>
                                                    <div className="bg-black/20 rounded-xl p-3 text-center">
                                                        <div className="text-xs text-gray-400 mb-1">Optimal Space</div>
                                                        <div className="font-mono text-green-300 font-bold">{currentFeedback.optimalSpaceComplexity}</div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Strengths / Improvements */}
                                            {currentFeedback.strengths && currentFeedback.strengths.length > 0 && (
                                                <div>
                                                    <h4 className="text-xs font-semibold text-green-400 mb-2 flex items-center gap-1"><CheckCircle2 size={12} /> Strengths</h4>
                                                    {currentFeedback.strengths.map((s, i) => (
                                                        <div key={i} className="text-xs text-gray-300 bg-green-500/5 rounded-lg px-3 py-2 mb-1">{s}</div>
                                                    ))}
                                                </div>
                                            )}
                                            {currentFeedback.improvements && currentFeedback.improvements.length > 0 && (
                                                <div>
                                                    <h4 className="text-xs font-semibold text-yellow-400 mb-2 flex items-center gap-1"><XCircle size={12} /> Improve</h4>
                                                    {currentFeedback.improvements.map((s, i) => (
                                                        <div key={i} className="text-xs text-gray-300 bg-yellow-500/5 rounded-lg px-3 py-2 mb-1">{s}</div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Detailed Feedback */}
                                            <div className="bg-black/20 rounded-xl p-4 text-xs text-gray-300 leading-relaxed">
                                                {currentFeedback.detailedFeedback}
                                            </div>

                                            <button onClick={handleNextQuestion}
                                                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-xl text-white font-semibold text-sm">
                                                Next Question <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 text-gray-500">
                                            <BarChart2 size={32} className="mx-auto mb-3 opacity-30" />
                                            <p className="text-sm">Submit your solution to see AI feedback</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Center: Code Editor */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Editor Toolbar */}
                    <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <Code2 size={14} className="text-purple-400" />
                            <select
                                value={language}
                                onChange={e => setLanguage(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-purple-500/50"
                            >
                                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={handleRunCode} disabled={isRunning}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-semibold hover:bg-green-500/20 transition-all disabled:opacity-50">
                                {isRunning ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                                Run
                            </button>
                            <button onClick={handleSubmit} disabled={isAIThinking}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-semibold hover:bg-purple-500/20 transition-all disabled:opacity-50">
                                {isAIThinking ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                                Submit
                            </button>
                        </div>
                    </div>

                    {/* Monaco Editor */}
                    <div className="flex-1 overflow-hidden">
                        <MonacoEditor
                            height="100%"
                            language={language === 'cpp' ? 'cpp' : language}
                            value={code}
                            onChange={v => setCode(v || '')}
                            theme="vs-dark"
                            options={{
                                fontSize: 14,
                                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                minimap: { enabled: false },
                                padding: { top: 16, bottom: 16 },
                                scrollBeyondLastLine: false,
                                lineNumbers: 'on',
                                renderLineHighlight: 'all',
                                suggestOnTriggerCharacters: true,
                                tabSize: 4,
                                wordWrap: 'on',
                                smoothScrolling: true,
                                cursorBlinking: 'smooth',
                                bracketPairColorization: { enabled: true },
                            }}
                        />
                    </div>

                    {/* Execution Result */}
                    {executionResult && (
                        <div className="border-t border-white/5 p-3 max-h-32 overflow-y-auto flex-shrink-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs font-semibold ${executionResult.error ? 'text-red-400' : 'text-green-400'}`}>
                                    {executionResult.error ? '✗ Error' : '✓ Output'}
                                </span>
                                {executionResult.executionTime && (
                                    <span className="text-xs text-gray-500">{executionResult.executionTime}ms</span>
                                )}
                                {executionResult.simulated && <span className="text-xs text-yellow-500">[simulated]</span>}
                            </div>
                            <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap">
                                {executionResult.output || executionResult.error}
                            </pre>
                        </div>
                    )}
                </div>

                {/* Right: AI Chat */}
                <div className="w-[28%] flex flex-col border-l border-white/5 overflow-hidden">
                    {/* Chat Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
                                <Brain size={14} className="text-white" />
                            </div>
                            <div>
                                <div className="text-xs font-semibold text-white">AI Interviewer</div>
                                <div className="text-[10px] text-green-400 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse inline-block" />
                                    {mode} Mode
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={toggleVoice}
                                className={`p-2 rounded-lg transition-all ${isListening ? 'bg-red-500/20 text-red-400 pulse-glow' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}>
                                {isListening ? <Mic size={14} /> : <MicOff size={14} />}
                            </button>
                            <button className="p-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all">
                                <Volume2 size={14} />
                            </button>
                        </div>
                    </div>

                    {/* Voice Wave if listening */}
                    {isListening && (
                        <div className="px-4 py-2 border-b border-white/5 flex-shrink-0">
                            <div className="voice-wave justify-center">
                                {Array.from({ length: 7 }).map((_, i) => <span key={i} />)}
                            </div>
                        </div>
                    )}

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {messages.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                <MessageSquare size={28} className="mx-auto mb-2 opacity-30" />
                                <p className="text-xs">Your AI interviewer will appear here</p>
                            </div>
                        )}
                        {messages.map((msg, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`${msg.role === 'ai' ? 'chat-bubble-ai' : 'chat-bubble-user ml-auto'} p-3 max-w-[90%] rounded-2xl`}
                            >
                                {msg.role === 'ai' && (
                                    <div className="flex items-center gap-1 mb-1">
                                        <Brain size={10} className="text-purple-400" />
                                        <span className="text-[10px] text-purple-400 font-semibold">AI</span>
                                    </div>
                                )}
                                <div className="text-xs text-gray-200 leading-relaxed">
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                </div>
                            </motion.div>
                        ))}
                        {isAIThinking && (
                            <div className="chat-bubble-ai p-3 max-w-[80%] rounded-2xl">
                                <div className="flex items-center gap-2 text-purple-400">
                                    <Loader2 size={12} className="animate-spin" />
                                    <span className="text-xs">Thinking...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Chat Input */}
                    <div className="p-3 border-t border-white/5 flex-shrink-0">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={e => setChatInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleChat()}
                                placeholder={isListening ? 'Listening...' : 'Ask the interviewer...'}
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition-all"
                            />
                            <button onClick={handleChat} disabled={isAIThinking || !chatInput.trim()}
                                className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-all disabled:opacity-30">
                                <Send size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
