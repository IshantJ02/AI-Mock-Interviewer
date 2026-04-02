'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useInterviewStore } from '@/store/interviewStore';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import api from '@/lib/api';
import Link from 'next/link';
import {
    Brain, Mic, MicOff, Send, Code2, Play,
    ChevronRight, RotateCcw, CheckCircle2, XCircle,
    MessageSquare, Timer, Trophy, ArrowLeft,
    Zap, BarChart2, ArrowRight, Loader2, Sparkles, Shield,
    AlertTriangle, Keyboard, FileText
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
    General: 'var(--accent)', Google: 'var(--accent)', Amazon: '#c08a4f', Meta: '#6a7fa8', Startup: '#b07070',
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
        code, language, codeModified, messages, isAIThinking, currentFeedback, sessionScore,
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
    const [showEndConfirm, setShowEndConfirm] = useState(false);
    const [isStarting, setIsStarting] = useState(false);
    const [mobilePanel, setMobilePanel] = useState<'problem' | 'editor' | 'chat'>('problem');
    const [behavioralAnswer, setBehavioralAnswer] = useState('');
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
        setIsStarting(true);
        try { reset(); setElapsedTime(0); await startSession(selectedMode, selectedType, selectedDifficulty); await fetchNextQuestion(selectedTopic || undefined); toast.success(`${selectedMode} Interview started! Good luck! 🎯`); }
        catch { toast.error('Failed to start interview. Check API key and backend.'); }
        finally { setIsStarting(false); }
    };
    const handleRunCode = useCallback(async () => {
        if (!code.trim()) { toast.error('Write some code first!'); return; }
        setIsRunning(true);
        try { const { data } = await api.post('/interview/execute', { code, language }); setExecutionResult(data.data); if (data.data.simulated) toast('Running in simulation mode (Docker not available)', { icon: 'ℹ️' }); }
        catch { toast.error('Execution failed'); } finally { setIsRunning(false); }
    }, [code, language]);
    const handleSubmit = useCallback(async () => {
        if (type === 'Behavioral' && behavioralAnswer.trim()) {
            try { await submitAnswer(behavioralAnswer); setActiveTab('feedback'); setBehavioralAnswer(''); toast.success('Answer submitted! Check feedback →'); }
            catch { toast.error('Submission failed'); }
        } else {
            try { await submitAnswer(); setActiveTab('feedback'); toast.success('Answer submitted! Check feedback →'); }
            catch { toast.error('Submission failed'); }
        }
    }, [type, behavioralAnswer, submitAnswer]);
    const handleNextQuestion = async () => { setExecutionResult(null); setActiveTab('problem'); setBehavioralAnswer(''); await fetchNextQuestion(selectedTopic || undefined); };
    const handleEndSession = async () => { setShowEndConfirm(false); await endSession(); toast.success(`Interview Complete! Final Score: ${sessionScore}/100 🏆`); };
    const handleChat = async () => { if (!chatInput.trim() || isAIThinking) return; const msg = chatInput; setChatInput(''); await sendMessage(msg); };
    const formatRelativeTime = (date: Date) => {
        const now = new Date();
        const diff = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
        if (diff < 60) return 'just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Keyboard shortcuts
    useEffect(() => {
        if (status !== 'active') return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                if (e.shiftKey) { handleSubmit(); }
                else { handleRunCode(); }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [status, handleRunCode, handleSubmit]);

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
            <main className="min-h-screen pt-24 px-4 pb-12 relative overflow-hidden" style={{ background: 'var(--bg)' }}>
                <div className="absolute inset-0 dot-bg opacity-20" />
                <div className="blob w-[350px] h-[350px] top-20 right-20" style={{ background: 'rgba(124,154,110,0.15)', opacity: 0.1 }} />
                <div className="max-w-4xl mx-auto relative z-10">
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={gentleSpring} className="mb-12">
                        <Link href="/dashboard" className="btn-tactile inline-flex items-center gap-2 text-sm mb-6 px-3 py-1.5 rounded-lg transition-all"
                            style={{ color: 'var(--text-muted)', background: 'transparent', border: '1px solid var(--border)' }}>
                            <ArrowLeft size={14} /> Back to Dashboard
                        </Link>
                        <span style={{ fontFamily: 'var(--font-hand)', fontSize: '1.2rem', color: 'var(--warm)' }}>set up your session 📝</span>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mt-2"
                            style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                            <span className="hand-underline" style={{ color: 'var(--accent)' }}>Configure</span> Your Interview
                        </h1>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ ...gentleSpring, delay: 0.1 }}
                        className="paper-card rounded-2xl p-8 space-y-8">

                        {/* Company */}
                        <div>
                            <label className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                                <Brain size={15} style={{ color: 'var(--accent)' }} /> Company Mode
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                {MODES.map(m => (
                                    <motion.button key={m} whileHover={{ y: -2, rotate: -0.5 }} whileTap={{ scale: 0.97 }}
                                        transition={gentleSpring} onClick={() => setSelectedMode(m)}
                                        className="btn-tactile py-3 rounded-xl text-sm font-semibold transition-all"
                                        style={{
                                            background: selectedMode === m ? MODE_COLORS[m] : 'var(--paper)',
                                            color: selectedMode === m ? 'var(--paper)' : 'var(--text-muted)',
                                            border: selectedMode === m ? `1px solid ${MODE_COLORS[m]}` : '1px solid var(--border)',
                                        }}>
                                        {MODE_EMOJI[m]} {m}
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        {/* Type */}
                        <div>
                            <label className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                                <Code2 size={15} style={{ color: 'var(--accent)' }} /> Interview Type
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                {['DSA', 'Behavioral', 'Mixed'].map(t => (
                                    <motion.button key={t} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} transition={gentleSpring}
                                        onClick={() => setSelectedType(t)}
                                        className="btn-tactile py-3 rounded-xl text-sm font-semibold transition-all"
                                        style={{
                                            background: selectedType === t ? 'var(--accent)' : 'var(--paper)',
                                            color: selectedType === t ? 'var(--paper)' : 'var(--text-muted)',
                                            border: selectedType === t ? '1px solid var(--accent)' : '1px solid var(--border)',
                                        }}>{t}</motion.button>
                                ))}
                            </div>
                        </div>

                        {/* Difficulty */}
                        <div>
                            <label className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                                <Zap size={15} style={{ color: 'var(--accent)' }} /> Difficulty
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                {DIFFICULTIES.map(d => {
                                    const dColor = d === 'Easy' ? 'var(--accent)' : d === 'Medium' ? 'var(--warm)' : 'var(--danger)';
                                    return (
                                        <motion.button key={d} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} transition={gentleSpring}
                                            onClick={() => setSelectedDifficulty(d)}
                                            className="btn-tactile py-3 rounded-xl text-sm font-semibold transition-all"
                                            style={{
                                                background: selectedDifficulty === d ? dColor : 'var(--paper)',
                                                color: selectedDifficulty === d ? 'var(--paper)' : 'var(--text-muted)',
                                                border: selectedDifficulty === d ? `1px solid ${dColor}` : '1px solid var(--border)',
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
                                <label className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                                    <BarChart2 size={15} style={{ color: 'var(--accent)' }} /> Topic Focus{' '}
                                    <span style={{ color: 'var(--text-light)', fontWeight: 400 }}>(optional)</span>
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    <button onClick={() => setSelectedTopic('')}
                                        className="btn-tactile px-4 py-2 rounded-lg text-xs font-medium transition-all"
                                        style={{
                                            background: !selectedTopic ? 'var(--accent)' : 'var(--paper)',
                                            color: !selectedTopic ? 'var(--paper)' : 'var(--text-light)',
                                            border: !selectedTopic ? '1px solid var(--accent)' : '1px solid var(--border)',
                                        }}>Auto (based on weaknesses)</button>
                                    {TOPICS_LIST.map(t => (
                                        <button key={t} onClick={() => setSelectedTopic(t)}
                                            className="btn-tactile px-4 py-2 rounded-lg text-xs font-medium transition-all"
                                            style={{
                                                background: selectedTopic === t ? 'var(--accent)' : 'var(--paper)',
                                                color: selectedTopic === t ? 'var(--paper)' : 'var(--text-light)',
                                                border: selectedTopic === t ? '1px solid var(--accent)' : '1px solid var(--border)',
                                            }}>{t}</button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Proctoring */}
                        <div>
                            <label className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                                <Shield size={15} style={{ color: 'var(--danger)' }} /> Proctored Mode
                            </label>
                            <button onClick={() => setProctored(!proctored)}
                                className="btn-tactile w-full flex items-center justify-between py-4 px-5 rounded-xl text-sm font-semibold transition-all"
                                style={{
                                    background: proctored ? 'rgba(192,84,79,0.05)' : 'var(--surface)',
                                    color: proctored ? 'var(--danger)' : 'var(--text-muted)',
                                    border: proctored ? '1px solid rgba(192,84,79,0.15)' : '1px solid var(--border)',
                                }}>
                                <div className="flex items-center gap-3">
                                    <Shield size={17} style={{ color: proctored ? 'var(--danger)' : 'var(--text-light)' }} />
                                    <div className="text-left">
                                        <div>{proctored ? '🔴 Proctored Mode ON' : 'Enable Proctored Mode'}</div>
                                        <div className="text-[10px] font-normal mt-0.5" style={{ color: 'var(--text-light)' }}>Webcam monitoring, face detection, tab-switch detection</div>
                                    </div>
                                </div>
                                <div className="w-10 h-5 rounded-full relative" style={{ background: proctored ? 'var(--danger)' : 'var(--border)' }}>
                                    <div className="w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all" style={{ left: proctored ? 'calc(100% - 18px)' : '2px' }} />
                                </div>
                            </button>
                        </div>

                        {/* Keyboard shortcuts hint */}
                        <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: 'rgba(124,154,110,0.04)', border: '1px solid rgba(124,154,110,0.1)' }}>
                            <Keyboard size={14} style={{ color: 'var(--accent)' }} />
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                <strong style={{ color: 'var(--text-secondary)' }}>Shortcuts:</strong> Ctrl+Enter = Run Code · Ctrl+Shift+Enter = Submit
                            </span>
                        </div>

                        {/* Start */}
                        <motion.button whileHover={{ scale: 1.01, y: -2 }} whileTap={{ scale: 0.98 }} transition={gentleSpring}
                            onClick={handleStart} disabled={isStarting}
                            className="btn-tactile w-full flex items-center justify-center gap-3 py-5 rounded-xl font-bold text-xl text-white transition-all disabled:opacity-70"
                            style={{ background: 'var(--accent)', boxShadow: '0 4px 24px rgba(124,154,110,0.2)' }}>
                            {isStarting ? (
                                <><Loader2 size={20} className="animate-spin" /> Starting Interview...</>
                            ) : (
                                <><Sparkles size={20} /> Start {proctored ? '🔒 Proctored ' : ''}AI Interview <ArrowRight size={18} /></>
                            )}
                        </motion.button>
                    </motion.div>
                </div>
            </main>
        );
    }

    // ── COMPLETED ──
    if (status === 'completed') {
        const circumference = 2 * Math.PI * 40;
        return (
            <main className="min-h-screen pt-24 px-4 pb-12 flex items-center justify-center" style={{ background: 'var(--bg)' }}>
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={gentleSpring}
                    className="max-w-lg w-full text-center">
                    <div className="paper-card rounded-2xl p-10">
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...gentleSpring, delay: 0.2 }}
                            className="text-6xl mb-6">🏆</motion.div>
                        <h2 className="text-4xl font-bold tracking-tight mb-2"
                            style={{ fontFamily: 'var(--font-heading)', color: 'var(--accent)' }}>Interview Complete!</h2>
                        <p className="mb-8" style={{ color: 'var(--text-muted)' }}>Great job pushing through. Here&apos;s your performance summary.</p>
                        <div className="relative w-36 h-36 mx-auto mb-4">
                            <svg className="w-full h-full score-ring" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="40" fill="none" stroke="var(--surface)" strokeWidth="8" />
                                <motion.circle cx="50" cy="50" r="40" fill="none"
                                    stroke={sessionScore >= 70 ? 'var(--accent)' : sessionScore >= 50 ? 'var(--warm)' : 'var(--danger)'}
                                    strokeWidth="8" strokeLinecap="round"
                                    strokeDasharray={circumference}
                                    initial={{ strokeDashoffset: circumference }}
                                    animate={{ strokeDashoffset: circumference * (1 - sessionScore / 100) }}
                                    transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.5 }} />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
                                    className="text-3xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: sessionScore >= 70 ? 'var(--accent)' : sessionScore >= 50 ? 'var(--warm)' : 'var(--danger)' }}>
                                    {sessionScore}
                                </motion.span>
                                <span className="text-xs" style={{ color: 'var(--text-light)' }}>/100</span>
                            </div>
                        </div>
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
                            className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
                            {sessionScore >= 80 ? '🌟 Outstanding performance!' : sessionScore >= 60 ? '💪 Good work, keep it up!' : sessionScore >= 40 ? '📈 Room for improvement — practice more!' : '🎯 Keep practicing, you\'ll get there!'}
                        </motion.p>
                        <p className="text-xs mb-6" style={{ color: 'var(--text-light)' }}>Time spent: {formatTime(elapsedTime)}</p>
                        <div className="flex gap-4">
                            <button onClick={() => reset()} className="btn-tactile flex-1 py-3 rounded-xl flex items-center justify-center gap-2"
                                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                                <RotateCcw size={15} /> Try Again
                            </button>
                            <button onClick={() => router.push('/dashboard')}
                                className="btn-tactile flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 text-white"
                                style={{ background: 'var(--accent)' }}>
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
        <main className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--bg)' }}>
            <ProctorMonitor enabled={proctored} />

            {/* Top Bar */}
            <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
                style={{ background: 'var(--paper)', borderBottom: '1px solid var(--border)' }}>
                <div className="flex items-center gap-3">
                    <div className="px-3 py-1 rounded-lg text-xs font-bold"
                        style={{ background: `${MODE_COLORS[mode]}12`, color: MODE_COLORS[mode], border: `1px solid ${MODE_COLORS[mode]}20` }}>
                        {mode}
                    </div>
                    <span className="px-2 py-1 rounded text-xs font-medium"
                        style={{
                            color: difficulty === 'Easy' ? 'var(--accent)' : difficulty === 'Medium' ? 'var(--warm)' : 'var(--danger)',
                            background: difficulty === 'Easy' ? 'rgba(124,154,110,0.06)' : difficulty === 'Medium' ? 'rgba(212,165,116,0.06)' : 'rgba(192,84,79,0.06)',
                        }}>{difficulty}</span>
                    <span className="text-xs" style={{ color: 'var(--text-light)' }}>{type}</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm font-mono">
                        <Timer size={13} style={{ color: 'var(--accent)' }} />
                        <span style={{ color: elapsedTime > 1800 ? 'var(--danger)' : 'var(--text-secondary)' }}>{formatTime(elapsedTime)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <Trophy size={13} style={{ color: 'var(--warm)' }} />
                        <span className="font-bold" style={{ color: 'var(--accent)' }}>{sessionScore}/100</span>
                    </div>
                    <button onClick={() => setShowEndConfirm(true)}
                        className="btn-tactile px-4 py-2 rounded-lg text-xs font-semibold"
                        style={{ background: 'rgba(192,84,79,0.06)', color: 'var(--danger)', border: '1px solid rgba(192,84,79,0.12)' }}>
                        End Interview
                    </button>
                </div>
            </div>

            {/* Mobile panel switcher */}
            <div className="flex md:hidden flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
                {(['problem', ...(type !== 'Behavioral' ? ['editor' as const] : []), 'chat'] as const).map(panel => (
                    <button key={panel} onClick={() => setMobilePanel(panel)}
                        className="flex-1 py-2.5 text-xs font-semibold capitalize transition-all"
                        style={{
                            color: mobilePanel === panel ? 'var(--accent)' : 'var(--text-light)',
                            borderBottom: mobilePanel === panel ? '2px solid var(--accent)' : '2px solid transparent',
                            background: mobilePanel === panel ? 'rgba(124,154,110,0.04)' : 'transparent',
                        }}>
                        {panel === 'problem' ? '📋 Problem' : panel === 'editor' ? '💻 Code' : '💬 Chat'}
                    </button>
                ))}
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left: Problem + Feedback */}
                <div className={`${type === 'Behavioral' ? 'md:w-[55%]' : 'md:w-[42%]'} ${mobilePanel === 'problem' ? 'flex' : 'hidden'} md:flex flex-col overflow-hidden w-full`} style={{ borderRight: '1px solid var(--border)' }}>
                    <div className="flex flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
                        {['problem', 'feedback'].map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab as 'problem' | 'feedback')}
                                className="flex-1 py-3 text-xs font-semibold capitalize transition-all"
                                style={{
                                    color: activeTab === tab ? 'var(--accent)' : 'var(--text-light)',
                                    borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                                }}>
                                {tab === 'problem' ? '📋 Problem' : '📊 AI Feedback'}
                                {tab === 'feedback' && currentFeedback && (
                                    <span className="ml-2 px-1.5 py-0.5 rounded text-[10px]"
                                        style={{ background: 'rgba(124,154,110,0.08)', color: 'var(--accent)' }}>{currentFeedback.score}</span>
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
                                            <h2 className="text-xl font-bold leading-tight" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                                                {currentQuestion.title || currentQuestion.question}
                                            </h2>
                                            {currentQuestion.description && <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{currentQuestion.description}</p>}
                                            {currentQuestion.examples && currentQuestion.examples.length > 0 && (
                                                <div className="space-y-2">
                                                    <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Examples</h4>
                                                    {currentQuestion.examples.slice(0, 2).map((ex, i) => (
                                                        <div key={i} className="rounded-lg p-3 font-mono text-xs"
                                                            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                                                            <div><span style={{ color: 'var(--text-light)' }}>Input:</span> <span style={{ color: 'var(--accent)' }}>{ex.input}</span></div>
                                                            <div><span style={{ color: 'var(--text-light)' }}>Output:</span> <span style={{ color: 'var(--accent)' }}>{ex.output}</span></div>
                                                            {ex.explanation && <div style={{ color: 'var(--text-muted)' }} className="mt-1">{ex.explanation}</div>}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {currentQuestion.constraints && currentQuestion.constraints.length > 0 && (
                                                <div>
                                                    <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Constraints</h4>
                                                    {currentQuestion.constraints.map((c, i) => <div key={i} className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>• {c}</div>)}
                                                </div>
                                            )}
                                            {currentQuestion.hints && currentQuestion.hints.length > 0 && (
                                                <details className="group">
                                                    <summary className="text-xs cursor-pointer font-semibold" style={{ color: 'var(--warm)' }}>💡 Hints (click to reveal)</summary>
                                                    <div className="mt-2 space-y-1">
                                                        {currentQuestion.hints.map((h, i) => (
                                                            <div key={i} className="text-xs rounded-lg p-2" style={{ color: 'var(--text-secondary)', background: 'rgba(212,165,116,0.05)' }}>Hint {i + 1}: {h}</div>
                                                        ))}
                                                    </div>
                                                </details>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center h-40">
                                            <Loader2 size={22} className="animate-spin" style={{ color: 'var(--accent)' }} />
                                        </div>
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div key="feedback" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    {currentFeedback ? (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between p-4 rounded-xl"
                                                style={{ background: 'rgba(124,154,110,0.05)', border: '1px solid rgba(124,154,110,0.1)' }}>
                                                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Overall Score</span>
                                                <span className="text-3xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--accent)' }}>
                                                    {currentFeedback.score}<span className="text-base" style={{ color: 'var(--text-light)' }}>/100</span>
                                                </span>
                                            </div>
                                            {currentFeedback.timeComplexity && (
                                                <div className="grid grid-cols-2 gap-2">
                                                    {[
                                                        { label: 'Your Time', val: currentFeedback.timeComplexity, color: 'var(--accent)' },
                                                        { label: 'Optimal Time', val: currentFeedback.optimalTimeComplexity, color: 'var(--accent)' },
                                                        { label: 'Your Space', val: currentFeedback.spaceComplexity, color: 'var(--accent)' },
                                                        { label: 'Optimal Space', val: currentFeedback.optimalSpaceComplexity, color: 'var(--accent)' },
                                                    ].map(({ label, val, color }) => (
                                                        <div key={label} className="rounded-lg p-3 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                                                            <div className="text-xs mb-1" style={{ color: 'var(--text-light)' }}>{label}</div>
                                                            <div className="font-mono font-bold" style={{ color }}>{val}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {currentFeedback.strengths && currentFeedback.strengths.length > 0 && (
                                                <div>
                                                    <h4 className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: 'var(--accent)' }}>
                                                        <CheckCircle2 size={11} /> Strengths
                                                    </h4>
                                                    {currentFeedback.strengths.map((s, i) => (
                                                        <div key={i} className="text-xs rounded-lg px-3 py-2 mb-1" style={{ color: 'var(--text-secondary)', background: 'rgba(124,154,110,0.04)' }}>{s}</div>
                                                    ))}
                                                </div>
                                            )}
                                            {currentFeedback.improvements && currentFeedback.improvements.length > 0 && (
                                                <div>
                                                    <h4 className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: 'var(--warm)' }}>
                                                        <XCircle size={11} /> Improve
                                                    </h4>
                                                    {currentFeedback.improvements.map((s, i) => (
                                                        <div key={i} className="text-xs rounded-lg px-3 py-2 mb-1" style={{ color: 'var(--text-secondary)', background: 'rgba(212,165,116,0.04)' }}>{s}</div>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="rounded-lg p-4 text-xs leading-relaxed" style={{ background: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                                                {currentFeedback.detailedFeedback}
                                            </div>
                                            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={handleNextQuestion}
                                                className="btn-tactile w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-sm text-white"
                                                style={{ background: 'var(--accent)' }}>
                                                Next Question <ChevronRight size={15} />
                                            </motion.button>
                                        </div>
                                    ) : (
                                        <div className="text-center py-12" style={{ color: 'var(--text-light)' }}>
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
                    <div className={`flex-1 ${mobilePanel === 'editor' ? 'flex' : 'hidden'} md:flex flex-col overflow-hidden`}>
                        <div className="flex items-center justify-between px-4 py-2 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
                            <div className="flex items-center gap-2">
                                <Code2 size={13} style={{ color: 'var(--accent)' }} />
                                <select value={language} onChange={e => {
                                    if (codeModified && !window.confirm('Switching language will reset your code. Continue?')) return;
                                    setLanguage(e.target.value);
                                }}
                                    className="rounded-lg px-2 py-1 text-xs focus:outline-none"
                                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                                    {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <motion.button whileTap={{ scale: 0.95 }} onClick={handleRunCode} disabled={isRunning}
                                    className="btn-tactile flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50"
                                    style={{ background: 'rgba(124,154,110,0.06)', color: 'var(--accent)', border: '1px solid rgba(124,154,110,0.12)' }}>
                                    {isRunning ? <Loader2 size={11} className="animate-spin" /> : <Play size={11} />} Run
                                </motion.button>
                                <motion.button whileTap={{ scale: 0.95 }} onClick={handleSubmit} disabled={isAIThinking}
                                    className="btn-tactile flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50 text-white"
                                    style={{ background: 'var(--accent)' }}>
                                    {isAIThinking ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />} Submit
                                </motion.button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden">
                            <MonacoEditor height="100%" language={language === 'cpp' ? 'cpp' : language}
                                value={code} onChange={v => setCode(v || '')} theme="vs-dark"
                                options={{
                                    fontSize: 14, fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                    minimap: { enabled: false }, padding: { top: 16, bottom: 16 },
                                    scrollBeyondLastLine: false, lineNumbers: 'on', renderLineHighlight: 'all',
                                    suggestOnTriggerCharacters: true, tabSize: 4, wordWrap: 'on',
                                    smoothScrolling: true, cursorBlinking: 'smooth', bracketPairColorization: { enabled: true },
                                }} />
                        </div>

                        {executionResult && (
                            <div className="p-3 max-h-32 overflow-y-auto flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-semibold" style={{ color: executionResult.error ? 'var(--danger)' : 'var(--accent)' }}>
                                        {executionResult.error ? '✗ Error' : '✓ Output'}
                                    </span>
                                    {executionResult.executionTime && <span className="text-xs" style={{ color: 'var(--text-light)' }}>{executionResult.executionTime}ms</span>}
                                    {executionResult.simulated && <span className="text-xs" style={{ color: 'var(--warm)' }}>[simulated]</span>}
                                </div>
                                <pre className="text-xs font-mono whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>{executionResult.output || executionResult.error}</pre>
                            </div>
                        )}
                    </div>
                )}

                {/* Right: Chat */}
                <div className={`${type === 'Behavioral' ? 'md:flex-1' : 'md:w-[28%]'} ${mobilePanel === 'chat' ? 'flex' : 'hidden'} md:flex flex-col overflow-hidden w-full`} style={{ borderLeft: '1px solid var(--border)' }}>
                    <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white" style={{ background: 'var(--accent)' }}>
                                <Brain size={13} />
                            </div>
                            <div>
                                <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>AI Interviewer</div>
                                <div className="text-[10px] flex items-center gap-1" style={{ color: 'var(--accent)' }}>
                                    <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ background: 'var(--accent)' }} />
                                    {mode} Mode
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={toggleVoice} className="btn-tactile p-2 rounded-lg"
                                title={isListening ? 'Stop listening' : 'Start voice input'}
                                style={{ background: isListening ? 'rgba(192,84,79,0.06)' : 'transparent', color: isListening ? 'var(--danger)' : 'var(--text-light)' }}>
                                {isListening ? <Mic size={13} /> : <MicOff size={13} />}
                            </button>
                        </div>
                    </div>

                    {isListening && (
                        <div className="px-4 py-2 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
                            <div className="voice-wave justify-center">{Array.from({ length: 7 }).map((_, i) => <span key={i} />)}</div>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {messages.length === 0 && (
                            <div className="text-center py-8" style={{ color: 'var(--text-light)' }}>
                                <MessageSquare size={26} className="mx-auto mb-2 opacity-30" />
                                <p className="text-xs">Your AI interviewer will appear here</p>
                            </div>
                        )}
                        {messages.map((msg, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={gentleSpring}
                                className={`${msg.role === 'ai' ? 'chat-bubble-ai' : 'chat-bubble-user ml-auto'} p-3 max-w-[90%] rounded-2xl`}>
                                {msg.role === 'ai' && (
                                    <div className="flex items-center gap-1 mb-1">
                                        <Brain size={9} style={{ color: 'var(--accent)' }} />
                                        <span className="text-[10px] font-semibold" style={{ color: 'var(--accent)' }}>AI</span>
                                    </div>
                                )}
                                <div className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                                <div className="text-[9px] mt-1 text-right" style={{ color: 'var(--text-light)' }}>{formatRelativeTime(msg.timestamp)}</div>
                            </motion.div>
                        ))}
                        {isAIThinking && (
                            <div className="chat-bubble-ai p-3 max-w-[80%] rounded-2xl">
                                <div className="flex items-center gap-2" style={{ color: 'var(--accent)' }}>
                                    <Loader2 size={11} className="animate-spin" /><span className="text-xs">Thinking...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Behavioral answer textarea */}
                    {type === 'Behavioral' && (
                        <div className="p-3 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
                            <div className="flex items-center gap-2 mb-2">
                                <FileText size={12} style={{ color: 'var(--accent)' }} />
                                <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Your Answer (STAR Method)</span>
                                <span className="text-[10px] ml-auto" style={{ color: 'var(--text-light)' }}>{behavioralAnswer.split(/\s+/).filter(Boolean).length} words</span>
                            </div>
                            <textarea
                                value={behavioralAnswer}
                                onChange={e => setBehavioralAnswer(e.target.value)}
                                placeholder="Describe the Situation, Task, Action, and Result..."
                                className="w-full rounded-lg px-3 py-2.5 text-xs focus:outline-none transition-all resize-none"
                                rows={6}
                                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                onFocus={e => { e.target.style.borderColor = 'rgba(124,154,110,0.3)'; }}
                                onBlur={e => { e.target.style.borderColor = 'var(--border)'; }}
                            />
                            <motion.button whileTap={{ scale: 0.98 }} onClick={handleSubmit}
                                disabled={isAIThinking || !behavioralAnswer.trim()}
                                className="btn-tactile w-full mt-2 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold text-white disabled:opacity-40"
                                style={{ background: 'var(--accent)' }}>
                                {isAIThinking ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />} Submit Answer
                            </motion.button>
                        </div>
                    )}

                    <div className="p-3 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
                        <div className="flex gap-2">
                            <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleChat()}
                                placeholder={isListening ? 'Listening...' : 'Ask the interviewer...'}
                                className="flex-1 rounded-lg px-3 py-2.5 text-xs focus:outline-none transition-all"
                                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                onFocus={e => { e.target.style.borderColor = 'rgba(124,154,110,0.3)'; }}
                                onBlur={e => { e.target.style.borderColor = 'var(--border)'; }} />
                            <motion.button whileTap={{ scale: 0.9 }} onClick={handleChat} disabled={isAIThinking || !chatInput.trim()}
                                className="btn-tactile p-2.5 rounded-lg disabled:opacity-30"
                                style={{ background: 'rgba(124,154,110,0.08)', color: 'var(--accent)' }}>
                                <Send size={13} />
                            </motion.button>
                        </div>
                    </div>
                </div>
            </div>

            {/* End Interview Confirmation Modal */}
            <AnimatePresence>
                {showEndConfirm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center px-4"
                        style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
                        onClick={() => setShowEndConfirm(false)}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            transition={gentleSpring}
                            onClick={e => e.stopPropagation()}
                            className="paper-card rounded-2xl p-8 max-w-md w-full text-center">
                            <div className="w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center"
                                style={{ background: 'rgba(192,84,79,0.08)', border: '1px solid rgba(192,84,79,0.15)' }}>
                                <AlertTriangle size={24} style={{ color: 'var(--danger)' }} />
                            </div>
                            <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>End Interview?</h3>
                            <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>This action cannot be undone. Your current progress will be saved.</p>
                            <div className="flex items-center justify-center gap-2 mb-6 px-4 py-2 rounded-lg"
                                style={{ background: 'rgba(124,154,110,0.05)', border: '1px solid rgba(124,154,110,0.1)' }}>
                                <Trophy size={14} style={{ color: 'var(--warm)' }} />
                                <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>Current Score: {sessionScore}/100</span>
                                <span className="text-xs" style={{ color: 'var(--text-light)' }}>· {formatTime(elapsedTime)}</span>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setShowEndConfirm(false)}
                                    className="btn-tactile flex-1 py-3 rounded-xl text-sm font-medium"
                                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                                    Continue Interview
                                </button>
                                <button onClick={handleEndSession}
                                    className="btn-tactile flex-1 py-3 rounded-xl text-sm font-semibold text-white"
                                    style={{ background: 'var(--danger)' }}>
                                    End Interview
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
