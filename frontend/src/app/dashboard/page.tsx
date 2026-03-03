'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, RadarChart, Radar, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import Navbar from '@/components/ui/Navbar';
import {
    Brain, Code2, TrendingUp, Target, Zap, Trophy,
    AlertTriangle, CheckCircle2, ArrowRight, Loader2,
    Calendar, Clock, BarChart2, Sparkles, ChevronRight
} from 'lucide-react';

interface DashboardData {
    user: {
        name: string;
        stats: { totalInterviews: number; averageScore: number; totalQuestionsAnswered: number; streak: number };
        skillMap: Record<string, number>;
        weakTopics: string[];
    };
    stats: {
        scoreTrend: Array<{ date: string; score: number; mode: string }>;
        topicFrequency: Record<string, number>;
    } | null;
    heatmap: Array<{ topic: string; score: number; level: string }>;
    weakTopics: Array<{ topic: string; score: number; priority: string }>;
    recommendations: Array<{ topic: string; score: number; priority: string; suggestedDifficulty: string; message: string }>;
}

const LEVEL_COLORS: Record<string, string> = {
    weak: 'bg-red-500/30 text-red-300 border-red-500/30',
    developing: 'bg-yellow-500/30 text-yellow-300 border-yellow-500/30',
    good: 'bg-blue-500/30 text-blue-300 border-blue-500/30',
    excellent: 'bg-green-500/30 text-green-300 border-green-500/30',
};

const SCORE_BG: Record<string, string> = {
    weak: 'bg-red-500',
    developing: 'bg-yellow-500',
    good: 'bg-blue-500',
    excellent: 'bg-green-500',
};

export default function DashboardPage() {
    const { isAuthenticated, user } = useAuthStore();
    const router = useRouter();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [sessions, setSessions] = useState<Array<{ _id: string; createdAt: string; mode: string; difficulty: string; type: string; overallScore: number; status: string; duration: number }>>([]);

    useEffect(() => {
        if (!isAuthenticated) { router.push('/login'); return; }
        fetchDashboard();
    }, [isAuthenticated]); // eslint-disable-line

    const fetchDashboard = async () => {
        setLoading(true);
        try {
            const [statsRes, heatmapRes, sessionsRes] = await Promise.all([
                api.get('/dashboard/stats'),
                api.get('/dashboard/heatmap'),
                api.get('/interview/sessions?limit=5'),
            ]);
            setData({
                user: statsRes.data.data.user,
                stats: statsRes.data.data.stats,
                heatmap: heatmapRes.data.data.heatmap,
                weakTopics: statsRes.data.data.weakTopics,
                recommendations: statsRes.data.data.recommendations,
            });
            setSessions(sessionsRes.data.data.sessions || []);
        } catch (err) {
            console.error('Dashboard fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <Navbar />
                <div className="text-center">
                    <Loader2 size={40} className="text-purple-400 animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    const userStats = data?.user?.stats || { totalInterviews: 0, averageScore: 0, totalQuestionsAnswered: 0, streak: 0 };
    const skillMap = data?.user?.skillMap || {};

    // Format skill map for radar chart
    const radarData = Object.entries(skillMap).slice(0, 8).map(([key, val]) => ({
        topic: key.replace(/([A-Z])/g, ' $1').trim().slice(0, 12),
        score: val,
    }));

    // Score trend data
    const trendData = (data?.stats?.scoreTrend || []).map(s => ({
        date: new Date(s.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        score: s.score,
    }));

    return (
        <main className="min-h-screen bg-gray-950 pb-12 relative overflow-hidden">
            <Navbar />
            <div className="absolute inset-0 dot-bg opacity-5" />
            <div className="blob w-96 h-96 bg-purple-700 top-0 right-0 opacity-10" />

            <div className="max-w-7xl mx-auto px-4 pt-28 relative z-10">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-10">
                    <div>
                        <h1 className="text-4xl font-black text-white mb-1">
                            Welcome back, <span className="gradient-text">{user?.name || 'Coder'}</span> 👋
                        </h1>
                        <p className="text-gray-400">Track your progress and crush your next interview</p>
                    </div>
                    <Link href="/interview"
                        className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-2xl text-white font-bold hover:scale-105 transition-all glow-purple">
                        <Sparkles size={18} />
                        New Interview
                        <ArrowRight size={16} />
                    </Link>
                </motion.div>

                {/* Stat Cards */}
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Interviews Done', value: userStats.totalInterviews, icon: Brain, color: 'purple', suffix: '' },
                        { label: 'Average Score', value: userStats.averageScore, icon: Trophy, color: 'yellow', suffix: '/100' },
                        { label: 'Questions Solved', value: userStats.totalQuestionsAnswered, icon: Code2, color: 'cyan', suffix: '' },
                        { label: 'Current Streak', value: userStats.streak, icon: Zap, color: 'orange', suffix: ' days' },
                    ].map(({ label, value, icon: Icon, color, suffix }) => (
                        <div key={label} className="glass rounded-2xl p-5 hover:border-purple-500/20 transition-all">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color === 'purple' ? 'bg-purple-500/20 text-purple-400' :
                                    color === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' :
                                        color === 'cyan' ? 'bg-cyan-500/20 text-cyan-400' :
                                            'bg-orange-500/20 text-orange-400'
                                }`}>
                                <Icon size={20} />
                            </div>
                            <div className="text-3xl font-black gradient-text mb-1">{value}{suffix}</div>
                            <div className="text-xs text-gray-400">{label}</div>
                        </div>
                    ))}
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    {/* Score Trend */}
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="lg:col-span-2 glass rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <TrendingUp size={18} className="text-purple-400" />
                                Score Trend
                            </h3>
                            <span className="text-xs text-gray-500">Last 10 sessions</span>
                        </div>
                        {trendData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={200}>
                                <LineChart data={trendData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 12, color: '#e2e8f0', fontSize: 12 }}
                                    />
                                    <Line type="monotone" dataKey="score" stroke="url(#lineGrad)" strokeWidth={2.5} dot={{ fill: '#8b5cf6', r: 4 }} activeDot={{ r: 6, fill: '#a78bfa' }} />
                                    <defs>
                                        <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#8b5cf6" />
                                            <stop offset="100%" stopColor="#06b6d4" />
                                        </linearGradient>
                                    </defs>
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-48 flex items-center justify-center text-gray-500 text-sm">
                                Complete interviews to see your score trend
                            </div>
                        )}
                    </motion.div>

                    {/* Weak Topics */}
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className="glass rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                            <AlertTriangle size={18} className="text-yellow-400" />
                            Weak Topics
                        </h3>
                        {(data?.weakTopics || []).length > 0 ? (
                            <div className="space-y-3">
                                {(data?.weakTopics || []).slice(0, 5).map(({ topic, score, priority }) => (
                                    <div key={topic}>
                                        <div className="flex items-center justify-between text-xs mb-1">
                                            <span className="text-gray-300 capitalize">{topic.replace(/([A-Z])/g, ' $1').trim()}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${priority === 'High' ? 'text-red-400 bg-red-500/10' :
                                                    priority === 'Medium' ? 'text-yellow-400 bg-yellow-500/10' :
                                                        'text-blue-400 bg-blue-500/10'
                                                }`}>{priority}</span>
                                        </div>
                                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full progress-bar-animated rounded-full" style={{ width: `${score}%` }} />
                                        </div>
                                        <div className="text-right text-[10px] text-gray-500 mt-0.5">{score}%</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 text-gray-500 text-sm">
                                <CheckCircle2 size={24} className="mx-auto mb-2 text-green-400" />
                                No weak topics detected yet!
                            </div>
                        )}
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    {/* Skill Heatmap */}
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                        className="lg:col-span-2 glass rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-5">
                            <BarChart2 size={18} className="text-cyan-400" />
                            Skill Heatmap
                        </h3>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                            {(data?.heatmap || []).map(({ topic, score, level }) => (
                                <div key={topic}
                                    className={`heatmap-cell rounded-xl p-3 text-center border cursor-default transition-all ${LEVEL_COLORS[level]}`}
                                    title={`${topic}: ${score}%`}
                                >
                                    <div className="text-lg font-black mb-1">{score}</div>
                                    <div className="text-[9px] leading-tight opacity-80">{topic}</div>
                                    <div className="mt-1 h-1 rounded-full bg-black/20 overflow-hidden">
                                        <div className={`h-full ${SCORE_BG[level]} rounded-full transition-all`} style={{ width: `${score}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                            {Object.entries(LEVEL_COLORS).map(([level, cls]) => (
                                <div key={level} className="flex items-center gap-1.5">
                                    <div className={`w-3 h-3 rounded ${SCORE_BG[level]}`} />
                                    <span className="capitalize">{level}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Radar Chart */}
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                        className="glass rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
                            <Target size={18} className="text-pink-400" />
                            Skill Radar
                        </h3>
                        {radarData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={220}>
                                <RadarChart data={radarData}>
                                    <PolarGrid stroke="rgba(255,255,255,0.05)" />
                                    <PolarAngleAxis dataKey="topic" tick={{ fill: '#6b7280', fontSize: 9 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 8 }} />
                                    <Radar dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} dot={{ fill: '#a78bfa', r: 2 }} />
                                </RadarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-48 flex items-center justify-center text-gray-500 text-xs">
                                Complete interviews to generate radar
                            </div>
                        )}
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recommendations */}
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                        className="glass rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-5">
                            <Sparkles size={18} className="text-purple-400" />
                            Personalized Roadmap
                        </h3>
                        {(data?.recommendations || []).length > 0 ? (
                            <div className="space-y-3">
                                {data?.recommendations.map(({ topic, priority, suggestedDifficulty, message }) => (
                                    <div key={topic}
                                        className="flex items-start gap-3 p-3 rounded-xl bg-white/3 border border-white/5 hover:border-purple-500/20 transition-all">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${priority === 'High' ? 'bg-red-500/20 text-red-400' :
                                                priority === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                                    'bg-blue-500/20 text-blue-400'
                                            }`}>{priority[0]}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-white text-sm capitalize">{topic.replace(/([A-Z])/g, ' $1').trim()}</div>
                                            <div className="text-xs text-gray-400">{message}</div>
                                        </div>
                                        <Link href={`/interview?topic=${topic}&difficulty=${suggestedDifficulty}`}
                                            className="flex-shrink-0 p-1.5 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-all">
                                            <ChevronRight size={14} />
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 text-gray-500 text-sm">
                                Complete a few interviews to get personalized recommendations
                            </div>
                        )}
                    </motion.div>

                    {/* Recent Sessions */}
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                        className="glass rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-5">
                            <Calendar size={18} className="text-blue-400" />
                            Recent Sessions
                        </h3>
                        {sessions.length > 0 ? (
                            <div className="space-y-3">
                                {sessions.map(session => (
                                    <div key={session._id}
                                        className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5 hover:border-white/10 transition-all">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${session.mode === 'Google' ? 'bg-blue-500/20 text-blue-400' :
                                                session.mode === 'Amazon' ? 'bg-orange-500/20 text-orange-400' :
                                                    session.mode === 'Meta' ? 'bg-purple-500/20 text-purple-400' :
                                                        'bg-gray-500/20 text-gray-400'
                                            }`}>{session.mode[0]}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-white">{session.mode} · {session.type}</div>
                                            <div className="text-xs text-gray-500 flex items-center gap-2">
                                                <Clock size={10} />
                                                {new Date(session.createdAt).toLocaleDateString()}
                                                {session.duration && <span>· {session.duration}m</span>}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-sm font-bold ${session.overallScore >= 70 ? 'text-green-400' : session.overallScore >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                                                {session.overallScore || 0}
                                            </div>
                                            <div className="text-[10px] text-gray-500">/100</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500 text-sm">
                                <Brain size={28} className="mx-auto mb-2 opacity-30" />
                                No sessions yet. Start your first interview!
                            </div>
                        )}

                        <Link href="/interview" className="mt-4 flex items-center justify-center gap-2 py-3 glass rounded-xl text-gray-400 hover:text-white text-sm transition-all hover:border-white/20">
                            Start New Session <ArrowRight size={14} />
                        </Link>
                    </motion.div>
                </div>
            </div>
        </main>
    );
}
