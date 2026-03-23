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
    Zap, BarChart2, ArrowRight, Loader2, Sparkles, Shield
} from 'lucide-react';
import ProctorMonitor from '@/components/interview/ProctorMonitor';

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
    General: '#7c9a6e', Google: '#5a8f4c', Amazon: '#c08a4f', Meta: '#6a7fa8', Startup: '#b07070',
};
const MODE_EMOJI: Record<string, string> = {
    General: '🎯', Google: '🔍', Amazon: '📦', Meta: '⚡', Startup: '🚀',
};

const gentleSpring = { type: 'spring' as const, stiffness: 60, damping: 25, mass: 1.2 };

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
    const [proctored, setProctored] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [activeTab, setActiveTab] = useState<'problem' | 'feedback'>('problem');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<NodeJS.Timeout>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognitionRef = useRef<any>(null);

    useEffect(() => { if (!isAuthenticated) router.push('/login'); }, [isAuthenticated, router]);
    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    useEffect(() => {
        if (status === 'active') { timerRef.current = setInterval(() => setElapsedTime(t => t + 1), 1000); }
        else { if (timerRef.current) clearInterval(timerRef.current); }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [status]);

    const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    const handleStart = async () => {
        try { reset(); setElapsedTime(0); await startSession(selectedMode, selectedType, selectedDifficulty); await fetchNextQuestion(selectedTopic || undefined); toast.success(`${selectedMode} Interview started! Good luck! 🎯`); }
        catch { toast.error('Failed to start interview. Check API key and backend.'); }
    };
    const handleRunCode = async () => {
        if (!code.trim()) { toast.error('Write some code first!'); return; }
        setIsRunning(true);
        try { const { data } = await api.post('/interview/execute', { code, language }); setExecutionResult(data.data); if (data.data.simulated) toast('Running in simulation mode (Docker not available)', { icon: 'ℹ️' }); }
        catch { toast.error('Execution failed'); } finally { setIsRunning(false); }
    };
    const handleSubmit = async () => {
        try { await submitAnswer(); setActiveTab('feedback'); toast.success('Answer submitted! Check feedback →'); }
        catch { toast.error('Submission failed'); }
    };
    const handleNextQuestion = async () => { setExecutionResult(null); setActiveTab('problem'); await fetchNextQuestion(selectedTopic || undefined); };
    const handleEndSession = async () => { await endSession(); toast.success(`Interview Complete! Final Score: ${sessionScore}/100 🏆`); };
    const handleChat = async () => { if (!chatInput.trim() || isAIThinking) return; const msg = chatInput; setChatInput(''); await sendMessage(msg); };

    const toggleVoice = () => {
        if (typeof window === 'undefined') return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SR) { toast.error('Voice not supported in this browser'); return; }
        if (isListening) { recognitionRef.current?.stop(); setListening(false); }
        else {
            const recognition = new SR(); recognition.continuous = true; recognition.interimResults = true; recognition.lang = 'en-US';
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            recognition.onresult = (e: any) => { const t = Array.from(e.results as any[]).map((r: any) => r[0].transcript).join(''); setTranscript(t); setChatInput(t); };
            recognition.onend = () => setListening(false);
            recognition.start(); recognitionRef.current = recognition; setListening(true); toast.success('Listening... speak your answer');
        }
    };

    // ── SETUP ──
    if (status === 'idle') {
        return (
            <main className="min-h-screen pt-24 px-4 pb-12 relative overflow-hidden" style={{ background: '#faf8f4' }}>
                <div className="absolute inset-0 dot-bg opacity-20" />
                <div className="blob w-[350px] h-[350px] top-20 right-20" style={{ background: '#c4d8b8', opacity: 0.1 }} />
                <div className="max-w-4xl mx-auto relative z-10">
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={gentleSpring} className="mb-12">
                        <span style={{ fontFamily: 'var(--font-hand)', fontSize: '1.2rem', color: '#d4a574' }}>set up your session 📝</span>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mt-2"
                            style={{ fontFamily: 'var(--font-heading)', color: '#2d2926' }}>
                            <span className="hand-underline" style={{ color: '#5a7e4c' }}>Configure</span> Your Interview
                        </h1>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ ...gentleSpring, delay: 0.1 }}
                        className="paper-card rounded-2xl p-8 space-y-8">

                        {/* Company */}
                        <div>
                            <label className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#5c5650' }}>
                                <Brain size={15} style={{ color: '#7c9a6e' }} /> Company Mode
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                {MODES.map(m => (
                                    <motion.button key={m} whileHover={{ y: -2, rotate: -0.5 }} whileTap={{ scale: 0.97 }}
                                        transition={gentleSpring} onClick={() => setSelectedMode(m)}
                                        className="btn-tactile py-3 rounded-xl text-sm font-semibold transition-all"
                                        style={{
                                            background: selectedMode === m ? `${MODE_COLORS[m]}12` : '#f5f1ea',
                                            color: selectedMode === m ? MODE_COLORS[m] : '#9e9790',
                                            border: selectedMode === m ? `1px solid ${MODE_COLORS[m]}35` : '1px solid #e0dbd2',
                                        }}>
                                        {MODE_EMOJI[m]} {m}
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        {/* Type */}
                        <div>
                            <label className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#5c5650' }}>
                                <Code2 size={15} style={{ color: '#7c9a6e' }} /> Interview Type
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                {['DSA', 'Behavioral', 'Mixed'].map(t => (
                                    <motion.button key={t} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} transition={gentleSpring}
                                        onClick={() => setSelectedType(t)}
                                        className="btn-tactile py-3 rounded-xl text-sm font-semibold transition-all"
                                        style={{
                                            background: selectedType === t ? 'rgba(124,154,110,0.08)' : '#f5f1ea',
                                            color: selectedType === t ? '#5a7e4c' : '#9e9790',
                                            border: selectedType === t ? '1px solid rgba(124,154,110,0.2)' : '1px solid #e0dbd2',
                                        }}>{t}</motion.button>
                                ))}
                            </div>
                        </div>

                        {/* Difficulty */}
                        <div>
                            <label className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#5c5650' }}>
                                <Zap size={15} style={{ color: '#7c9a6e' }} /> Difficulty
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                {DIFFICULTIES.map(d => {
                                    const dColor = d === 'Easy' ? '#7c9a6e' : d === 'Medium' ? '#d4a574' : '#c0544f';
                                    return (
                                        <motion.button key={d} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} transition={gentleSpring}
                                            onClick={() => setSelectedDifficulty(d)}
                                            className="btn-tactile py-3 rounded-xl text-sm font-semibold transition-all"
                                            style={{
                                                background: selectedDifficulty === d ? `${dColor}10` : '#f5f1ea',
                                                color: selectedDifficulty === d ? dColor : '#9e9790',
                                                border: selectedDifficulty === d ? `1px solid ${dColor}30` : '1px solid #e0dbd2',
                                            }}>
                                            {d === 'Easy' ? '🟢' : d === 'Medium' ? '🟡' : '🔴'} {d}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Topic */}
                        {selectedType !== 'Behavioral' && (
                            <div>
                                <label className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#5c5650' }}>
                                    <BarChart2 size={15} style={{ color: '#7c9a6e' }} /> Topic Focus{' '}
                                    <span style={{ color: '#b8b2aa', fontWeight: 400 }}>(optional)</span>
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    <button onClick={() => setSelectedTopic('')}
                                        className="btn-tactile px-4 py-2 rounded-lg text-xs font-medium transition-all"
                                        style={{
                                            background: !selectedTopic ? 'rgba(124,154,110,0.08)' : '#f5f1ea',
                                            color: !selectedTopic ? '#5a7e4c' : '#b8b2aa',
                                            border: !selectedTopic ? '1px solid rgba(124,154,110,0.15)' : '1px solid #e0dbd2',
                                        }}>Auto (based on weaknesses)</button>
                                    {TOPICS_LIST.map(t => (
                                        <button key={t} onClick={() => setSelectedTopic(t)}
                                            className="btn-tactile px-4 py-2 rounded-lg text-xs font-medium transition-all"
                                            style={{
                                                background: selectedTopic === t ? 'rgba(124,154,110,0.08)' : '#f5f1ea',
                                                color: selectedTopic === t ? '#5a7e4c' : '#b8b2aa',
                                                border: selectedTopic === t ? '1px solid rgba(124,154,110,0.15)' : '1px solid #e0dbd2',
                                            }}>{t}</button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Proctoring */}
                        <div>
                            <label className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#5c5650' }}>
                                <Shield size={15} style={{ color: '#c0544f' }} /> Proctored Mode
                            </label>
                            <button onClick={() => setProctored(!proctored)}
                                className="btn-tactile w-full flex items-center justify-between py-4 px-5 rounded-xl text-sm font-semibold transition-all"
                                style={{
                                    background: proctored ? 'rgba(192,84,79,0.05)' : '#f5f1ea',
                                    color: proctored ? '#c0544f' : '#9e9790',
                                    border: proctored ? '1px solid rgba(192,84,79,0.15)' : '1px solid #e0dbd2',
                                }}>
                                <div className="flex items-center gap-3">
                                    <Shield size={17} style={{ color: proctored ? '#c0544f' : '#b8b2aa' }} />
                                    <div className="text-left">
                                        <div>{proctored ? '🔴 Proctored Mode ON' : 'Enable Proctored Mode'}</div>
                                        <div className="text-[10px] font-normal mt-0.5" style={{ color: '#b8b2aa' }}>Webcam monitoring, face detection, tab-switch detection</div>
                                    </div>
                                </div>
                                <div className="w-10 h-5 rounded-full relative" style={{ background: proctored ? '#c0544f' : '#d4cec3' }}>
                                    <div className="w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all" style={{ left: proctored ? 'calc(100% - 18px)' : '2px' }} />
                                </div>
                            </button>
                        </div>

                        {/* Start */}
                        <motion.button whileHover={{ scale: 1.01, y: -2 }} whileTap={{ scale: 0.98 }} transition={gentleSpring}
                            onClick={handleStart}
                            className="btn-tactile w-full flex items-center justify-center gap-3 py-5 rounded-xl font-bold text-xl text-white transition-all"
                            style={{ background: '#7c9a6e', boxShadow: '0 4px 24px rgba(124,154,110,0.2)' }}>
                            <Sparkles size={20} /> Start {proctored ? '🔒 Proctored ' : ''}AI Interview <ArrowRight size={18} />
                        </motion.button>
                    </motion.div>
                </div>
            </main>
        );
    }

    // ── COMPLETED ──
    if (status === 'completed') {
        return (
            <main className="min-h-screen pt-24 px-4 pb-12 flex items-center justify-center" style={{ background: '#faf8f4' }}>
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={gentleSpring}
                    className="max-w-lg w-full text-center">
                    <div className="paper-card rounded-2xl p-10">
                        <div className="text-6xl mb-6">🏆</div>
                        <h2 className="text-4xl font-bold tracking-tight mb-2"
                            style={{ fontFamily: 'var(--font-heading)', color: '#5a7e4c' }}>Interview Complete!</h2>
                        <p className="mb-8" style={{ color: '#9e9790' }}>Great job pushing through. Here&apos;s your performance summary.</p>
                        <div className="relative w-36 h-36 mx-auto mb-8">
                            <svg className="w-full h-full score-ring" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="40" fill="none" stroke="#f0ece4" strokeWidth="8" />
                                <circle cx="50" cy="50" r="40" fill="none" stroke="#7c9a6e" strokeWidth="8" strokeLinecap="round"
                                    strokeDasharray={`${2 * Math.PI * 40}`} strokeDashoffset={`${2 * Math.PI * 40 * (1 - sessionScore / 100)}`} />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: '#5a7e4c' }}>{sessionScore}</span>
                                <span className="text-xs" style={{ color: '#b8b2aa' }}>/100</span>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => reset()} className="btn-tactile flex-1 py-3 rounded-xl flex items-center justify-center gap-2"
                                style={{ background: '#f5f1ea', border: '1px solid #e0dbd2', color: '#5c5650' }}>
                                <RotateCcw size={15} /> Try Again
                            </button>
                            <button onClick={() => router.push('/dashboard')}
                                className="btn-tactile flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 text-white"
                                style={{ background: '#7c9a6e' }}>
                                <Trophy size={15} /> Dashboard
                            </button>
                        </div>
                    </div>
                </motion.div>
            </main>
        );
    }

    // ── ACTIVE ──
    return (
        <main className="h-screen flex flex-col overflow-hidden" style={{ background: '#faf8f4' }}>
            <ProctorMonitor enabled={proctored} />

            {/* Top Bar */}
            <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
                style={{ background: '#fffdf8', borderBottom: '1px solid #e0dbd2' }}>
                <div className="flex items-center gap-3">
                    <div className="px-3 py-1 rounded-lg text-xs font-bold"
                        style={{ background: `${MODE_COLORS[mode]}12`, color: MODE_COLORS[mode], border: `1px solid ${MODE_COLORS[mode]}20` }}>
                        {mode}
                    </div>
                    <span className="px-2 py-1 rounded text-xs font-medium"
                        style={{
                            color: difficulty === 'Easy' ? '#7c9a6e' : difficulty === 'Medium' ? '#d4a574' : '#c0544f',
                            background: difficulty === 'Easy' ? 'rgba(124,154,110,0.06)' : difficulty === 'Medium' ? 'rgba(212,165,116,0.06)' : 'rgba(192,84,79,0.06)',
                        }}>{difficulty}</span>
                    <span className="text-xs" style={{ color: '#b8b2aa' }}>{type}</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm font-mono">
                        <Timer size={13} style={{ color: '#7c9a6e' }} />
                        <span style={{ color: elapsedTime > 1800 ? '#c0544f' : '#5c5650' }}>{formatTime(elapsedTime)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <Trophy size={13} style={{ color: '#d4a574' }} />
                        <span className="font-bold" style={{ color: '#5a7e4c' }}>{sessionScore}/100</span>
                    </div>
                    <button onClick={handleEndSession}
                        className="btn-tactile px-4 py-2 rounded-lg text-xs font-semibold"
                        style={{ background: 'rgba(192,84,79,0.06)', color: '#c0544f', border: '1px solid rgba(192,84,79,0.12)' }}>
                        End Interview
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left: Problem + Feedback */}
                <div className={`${type === 'Behavioral' ? 'w-[55%]' : 'w-[42%]'} flex flex-col overflow-hidden`} style={{ borderRight: '1px solid #e0dbd2' }}>
                    <div className="flex flex-shrink-0" style={{ borderBottom: '1px solid #e0dbd2' }}>
                        {['problem', 'feedback'].map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab as 'problem' | 'feedback')}
                                className="flex-1 py-3 text-xs font-semibold capitalize transition-all"
                                style={{
                                    color: activeTab === tab ? '#5a7e4c' : '#b8b2aa',
                                    borderBottom: activeTab === tab ? '2px solid #7c9a6e' : '2px solid transparent',
                                }}>
                                {tab === 'problem' ? '📋 Problem' : '📊 AI Feedback'}
                                {tab === 'feedback' && currentFeedback && (
                                    <span className="ml-2 px-1.5 py-0.5 rounded text-[10px]"
                                        style={{ background: 'rgba(124,154,110,0.08)', color: '#7c9a6e' }}>{currentFeedback.score}</span>
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
                                            <h2 className="text-xl font-bold leading-tight" style={{ fontFamily: 'var(--font-heading)', color: '#2d2926' }}>
                                                {currentQuestion.title || currentQuestion.question}
                                            </h2>
                                            {currentQuestion.description && <p className="text-sm leading-relaxed" style={{ color: '#5c5650' }}>{currentQuestion.description}</p>}
                                            {currentQuestion.examples && currentQuestion.examples.length > 0 && (
                                                <div className="space-y-2">
                                                    <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#9e9790' }}>Examples</h4>
                                                    {currentQuestion.examples.slice(0, 2).map((ex, i) => (
                                                        <div key={i} className="rounded-lg p-3 font-mono text-xs"
                                                            style={{ background: '#f5f1ea', border: '1px solid #e0dbd2' }}>
                                                            <div><span style={{ color: '#b8b2aa' }}>Input:</span> <span style={{ color: '#7c9a6e' }}>{ex.input}</span></div>
                                                            <div><span style={{ color: '#b8b2aa' }}>Output:</span> <span style={{ color: '#5a7e4c' }}>{ex.output}</span></div>
                                                            {ex.explanation && <div style={{ color: '#9e9790' }} className="mt-1">{ex.explanation}</div>}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {currentQuestion.constraints && currentQuestion.constraints.length > 0 && (
                                                <div>
                                                    <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#9e9790' }}>Constraints</h4>
                                                    {currentQuestion.constraints.map((c, i) => <div key={i} className="text-xs font-mono" style={{ color: '#9e9790' }}>• {c}</div>)}
                                                </div>
                                            )}
                                            {currentQuestion.hints && currentQuestion.hints.length > 0 && (
                                                <details className="group">
                                                    <summary className="text-xs cursor-pointer font-semibold" style={{ color: '#d4a574' }}>💡 Hints (click to reveal)</summary>
                                                    <div className="mt-2 space-y-1">
                                                        {currentQuestion.hints.map((h, i) => (
                                                            <div key={i} className="text-xs rounded-lg p-2" style={{ color: '#5c5650', background: 'rgba(212,165,116,0.05)' }}>Hint {i + 1}: {h}</div>
                                                        ))}
                                                    </div>
                                                </details>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center h-40">
                                            <Loader2 size={22} className="animate-spin" style={{ color: '#7c9a6e' }} />
                                        </div>
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div key="feedback" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    {currentFeedback ? (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between p-4 rounded-xl"
                                                style={{ background: 'rgba(124,154,110,0.05)', border: '1px solid rgba(124,154,110,0.1)' }}>
                                                <span className="font-semibold" style={{ color: '#2d2926' }}>Overall Score</span>
                                                <span className="text-3xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: '#5a7e4c' }}>
                                                    {currentFeedback.score}<span className="text-base" style={{ color: '#b8b2aa' }}>/100</span>
                                                </span>
                                            </div>
                                            {currentFeedback.timeComplexity && (
                                                <div className="grid grid-cols-2 gap-2">
                                                    {[
                                                        { label: 'Your Time', val: currentFeedback.timeComplexity, color: '#5a7e4c' },
                                                        { label: 'Optimal Time', val: currentFeedback.optimalTimeComplexity, color: '#7c9a6e' },
                                                        { label: 'Your Space', val: currentFeedback.spaceComplexity, color: '#5a7e4c' },
                                                        { label: 'Optimal Space', val: currentFeedback.optimalSpaceComplexity, color: '#7c9a6e' },
                                                    ].map(({ label, val, color }) => (
                                                        <div key={label} className="rounded-lg p-3 text-center" style={{ background: '#f5f1ea', border: '1px solid #e0dbd2' }}>
                                                            <div className="text-xs mb-1" style={{ color: '#b8b2aa' }}>{label}</div>
                                                            <div className="font-mono font-bold" style={{ color }}>{val}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {currentFeedback.strengths && currentFeedback.strengths.length > 0 && (
                                                <div>
                                                    <h4 className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: '#7c9a6e' }}>
                                                        <CheckCircle2 size={11} /> Strengths
                                                    </h4>
                                                    {currentFeedback.strengths.map((s, i) => (
                                                        <div key={i} className="text-xs rounded-lg px-3 py-2 mb-1" style={{ color: '#5c5650', background: 'rgba(124,154,110,0.04)' }}>{s}</div>
                                                    ))}
                                                </div>
                                            )}
                                            {currentFeedback.improvements && currentFeedback.improvements.length > 0 && (
                                                <div>
                                                    <h4 className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: '#d4a574' }}>
                                                        <XCircle size={11} /> Improve
                                                    </h4>
                                                    {currentFeedback.improvements.map((s, i) => (
                                                        <div key={i} className="text-xs rounded-lg px-3 py-2 mb-1" style={{ color: '#5c5650', background: 'rgba(212,165,116,0.04)' }}>{s}</div>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="rounded-lg p-4 text-xs leading-relaxed" style={{ background: '#f5f1ea', color: '#5c5650', border: '1px solid #e0dbd2' }}>
                                                {currentFeedback.detailedFeedback}
                                            </div>
                                            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={handleNextQuestion}
                                                className="btn-tactile w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-sm text-white"
                                                style={{ background: '#7c9a6e' }}>
                                                Next Question <ChevronRight size={15} />
                                            </motion.button>
                                        </div>
                                    ) : (
                                        <div className="text-center py-12" style={{ color: '#b8b2aa' }}>
                                            <BarChart2 size={28} className="mx-auto mb-3 opacity-30" />
                                            <p className="text-sm">Submit your solution to see AI feedback</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Center: Editor — hidden for Behavioral */}
                {type !== 'Behavioral' && (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-2 flex-shrink-0" style={{ borderBottom: '1px solid #e0dbd2' }}>
                            <div className="flex items-center gap-2">
                                <Code2 size={13} style={{ color: '#7c9a6e' }} />
                                <select value={language} onChange={e => setLanguage(e.target.value)}
                                    className="rounded-lg px-2 py-1 text-xs focus:outline-none"
                                    style={{ background: '#f5f1ea', border: '1px solid #e0dbd2', color: '#5c5650' }}>
                                    {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <motion.button whileTap={{ scale: 0.95 }} onClick={handleRunCode} disabled={isRunning}
                                    className="btn-tactile flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50"
                                    style={{ background: 'rgba(124,154,110,0.06)', color: '#7c9a6e', border: '1px solid rgba(124,154,110,0.12)' }}>
                                    {isRunning ? <Loader2 size={11} className="animate-spin" /> : <Play size={11} />} Run
                                </motion.button>
                                <motion.button whileTap={{ scale: 0.95 }} onClick={handleSubmit} disabled={isAIThinking}
                                    className="btn-tactile flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50 text-white"
                                    style={{ background: '#7c9a6e' }}>
                                    {isAIThinking ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />} Submit
                                </motion.button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden">
                            <MonacoEditor height="100%" language={language === 'cpp' ? 'cpp' : language}
                                value={code} onChange={v => setCode(v || '')} theme="vs"
                                options={{
                                    fontSize: 14, fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                    minimap: { enabled: false }, padding: { top: 16, bottom: 16 },
                                    scrollBeyondLastLine: false, lineNumbers: 'on', renderLineHighlight: 'all',
                                    suggestOnTriggerCharacters: true, tabSize: 4, wordWrap: 'on',
                                    smoothScrolling: true, cursorBlinking: 'smooth', bracketPairColorization: { enabled: true },
                                }} />
                        </div>

                        {executionResult && (
                            <div className="p-3 max-h-32 overflow-y-auto flex-shrink-0" style={{ borderTop: '1px solid #e0dbd2' }}>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-semibold" style={{ color: executionResult.error ? '#c0544f' : '#7c9a6e' }}>
                                        {executionResult.error ? '✗ Error' : '✓ Output'}
                                    </span>
                                    {executionResult.executionTime && <span className="text-xs" style={{ color: '#b8b2aa' }}>{executionResult.executionTime}ms</span>}
                                    {executionResult.simulated && <span className="text-xs" style={{ color: '#d4a574' }}>[simulated]</span>}
                                </div>
                                <pre className="text-xs font-mono whitespace-pre-wrap" style={{ color: '#5c5650' }}>{executionResult.output || executionResult.error}</pre>
                            </div>
                        )}
                    </div>
                )}

                {/* Right: Chat */}
                <div className={`${type === 'Behavioral' ? 'flex-1' : 'w-[28%]'} flex flex-col overflow-hidden`} style={{ borderLeft: '1px solid #e0dbd2' }}>
                    <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid #e0dbd2' }}>
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white" style={{ background: '#7c9a6e' }}>
                                <Brain size={13} />
                            </div>
                            <div>
                                <div className="text-xs font-semibold" style={{ color: '#2d2926' }}>AI Interviewer</div>
                                <div className="text-[10px] flex items-center gap-1" style={{ color: '#7c9a6e' }}>
                                    <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ background: '#7c9a6e' }} />
                                    {mode} Mode
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={toggleVoice} className="btn-tactile p-2 rounded-lg"
                                style={{ background: isListening ? 'rgba(192,84,79,0.06)' : 'transparent', color: isListening ? '#c0544f' : '#b8b2aa' }}>
                                {isListening ? <Mic size={13} /> : <MicOff size={13} />}
                            </button>
                            <button className="p-2 rounded-lg" style={{ color: '#b8b2aa' }}><Volume2 size={13} /></button>
                        </div>
                    </div>

                    {isListening && (
                        <div className="px-4 py-2 flex-shrink-0" style={{ borderBottom: '1px solid #e0dbd2' }}>
                            <div className="voice-wave justify-center">{Array.from({ length: 7 }).map((_, i) => <span key={i} />)}</div>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {messages.length === 0 && (
                            <div className="text-center py-8" style={{ color: '#b8b2aa' }}>
                                <MessageSquare size={26} className="mx-auto mb-2 opacity-30" />
                                <p className="text-xs">Your AI interviewer will appear here</p>
                            </div>
                        )}
                        {messages.map((msg, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={gentleSpring}
                                className={`${msg.role === 'ai' ? 'chat-bubble-ai' : 'chat-bubble-user ml-auto'} p-3 max-w-[90%] rounded-2xl`}>
                                {msg.role === 'ai' && (
                                    <div className="flex items-center gap-1 mb-1">
                                        <Brain size={9} style={{ color: '#7c9a6e' }} />
                                        <span className="text-[10px] font-semibold" style={{ color: '#7c9a6e' }}>AI</span>
                                    </div>
                                )}
                                <div className="text-xs leading-relaxed" style={{ color: '#5c5650' }}><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                            </motion.div>
                        ))}
                        {isAIThinking && (
                            <div className="chat-bubble-ai p-3 max-w-[80%] rounded-2xl">
                                <div className="flex items-center gap-2" style={{ color: '#7c9a6e' }}>
                                    <Loader2 size={11} className="animate-spin" /><span className="text-xs">Thinking...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-3 flex-shrink-0" style={{ borderTop: '1px solid #e0dbd2' }}>
                        <div className="flex gap-2">
                            <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleChat()}
                                placeholder={isListening ? 'Listening...' : 'Ask the interviewer...'}
                                className="flex-1 rounded-lg px-3 py-2.5 text-xs focus:outline-none transition-all"
                                style={{ background: '#f5f1ea', border: '1px solid #e0dbd2', color: '#2d2926' }}
                                onFocus={e => { e.target.style.borderColor = 'rgba(124,154,110,0.3)'; }}
                                onBlur={e => { e.target.style.borderColor = '#e0dbd2'; }} />
                            <motion.button whileTap={{ scale: 0.9 }} onClick={handleChat} disabled={isAIThinking || !chatInput.trim()}
                                className="btn-tactile p-2.5 rounded-lg disabled:opacity-30"
                                style={{ background: 'rgba(124,154,110,0.08)', color: '#7c9a6e' }}>
                                <Send size={13} />
                            </motion.button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
