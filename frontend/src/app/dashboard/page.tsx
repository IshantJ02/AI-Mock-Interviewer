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
    Calendar, Clock, BarChart2, Sparkles, ChevronRight, RotateCcw
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
    weak: 'text-[var(--danger)] border-[var(--danger)]/20',
    developing: 'text-[var(--warm)] border-[var(--warm)]/20',
    good: 'text-[#6a7fa8] border-[#6a7fa8]/20',
    excellent: 'text-[var(--accent)] border-[var(--accent)]/20',
};
const LEVEL_BG: Record<string, string> = {
    weak: 'rgba(192,84,79,0.08)',
    developing: 'rgba(212,165,116,0.08)',
    good: 'rgba(106,127,168,0.08)',
    excellent: 'rgba(124,154,110,0.08)',
};
const SCORE_BG: Record<string, string> = {
    weak: 'var(--danger)',
    developing: 'var(--warm)',
    good: '#6a7fa8',
    excellent: 'var(--accent)',
};

const gentleSpring = { type: 'spring' as const, stiffness: 60, damping: 25, mass: 1.2 };

export default function DashboardPage() {
    const { isAuthenticated, user } = useAuthStore();
    const router = useRouter();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sessions, setSessions] = useState<Array<{ _id: string; createdAt: string; mode: string; difficulty: string; type: string; overallScore: number; status: string; duration: number }>>([]);

    useEffect(() => {
        if (!isAuthenticated) { router.push('/login'); return; }
        fetchDashboard();
    }, [isAuthenticated]); // eslint-disable-line

    const fetchDashboard = async () => {
        setLoading(true);
        setError(null);
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
            setError('Failed to load dashboard data. Please check your connection and try again.');
        }
        finally { setLoading(false); }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
                <Navbar />
                <div className="text-center">
                    <Loader2 size={36} className="animate-spin mx-auto mb-4" style={{ color: 'var(--accent)' }} />
                    <p style={{ color: 'var(--text-muted)' }}>Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
                <Navbar />
                <div className="text-center max-w-md mx-auto px-4">
                    <div className="paper-card rounded-2xl p-10">
                        <div className="w-16 h-16 rounded-xl mx-auto mb-5 flex items-center justify-center"
                            style={{ background: 'rgba(192,84,79,0.08)', border: '1px solid rgba(192,84,79,0.15)' }}>
                            <AlertTriangle size={28} style={{ color: 'var(--danger)' }} />
                        </div>
                        <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>Something went wrong</h2>
                        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>{error}</p>
                        <div className="flex gap-3">
                            <button onClick={fetchDashboard}
                                className="btn-tactile flex-1 py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
                                style={{ background: 'var(--accent)' }}>
                                <RotateCcw size={14} /> Try Again
                            </button>
                            <Link href="/interview"
                                className="btn-tactile flex-1 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
                                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                                <ArrowRight size={14} /> Start Interview
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const userStats = data?.user?.stats || { totalInterviews: 0, averageScore: 0, totalQuestionsAnswered: 0, streak: 0 };
    const skillMap = data?.user?.skillMap || {};
    const radarData = Object.entries(skillMap).slice(0, 8).map(([key, val]) => ({
        topic: key.replace(/([A-Z])/g, ' $1').trim().slice(0, 12), score: val,
    }));
    const trendData = (data?.stats?.scoreTrend || []).map(s => ({
        date: new Date(s.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }), score: s.score,
    }));

    const modeColors: Record<string, string> = { Google: 'var(--accent)', Amazon: '#c08a4f', Meta: '#6a7fa8', Startup: '#b07070' };

    return (
        <main className="min-h-screen pb-12 relative overflow-hidden" style={{ background: 'var(--bg)' }}>
            <Navbar />
            <div className="absolute inset-0 dot-bg opacity-10" />
            <div className="blob w-[400px] h-[400px] top-0 right-0" style={{ background: 'rgba(124,154,110,0.15)', opacity: 0.08 }} />

            <div className="max-w-7xl mx-auto px-6 pt-28 relative z-10">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={gentleSpring}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-1"
                            style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                            Welcome back, <span className="hand-underline" style={{ color: 'var(--accent)' }}>{user?.name || 'Coder'}</span> 👋
                        </h1>
                        <p style={{ color: 'var(--text-muted)' }}>Track your progress and crush your next interview</p>
                    </div>
                    <Link href="/interview"
                        className="btn-tactile flex items-center gap-3 px-6 py-3 rounded-xl font-bold text-white"
                        style={{ background: 'var(--accent)', boxShadow: '0 2px 12px rgba(124,154,110,0.15)' }}>
                        <Sparkles size={16} /> New Interview <ArrowRight size={14} />
                    </Link>
                </motion.div>

                {/* Stat Cards */}
                <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ ...gentleSpring, delay: 0.1 }}
                    className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Interviews Done', value: userStats.totalInterviews, icon: Brain, suffix: '' },
                        { label: 'Average Score', value: userStats.averageScore, icon: Trophy, suffix: '/100' },
                        { label: 'Questions Solved', value: userStats.totalQuestionsAnswered, icon: Code2, suffix: '' },
                        { label: 'Current Streak', value: userStats.streak, icon: Zap, suffix: ' days' },
                    ].map(({ label, value, icon: Icon, suffix }, i) => (
                        <motion.div key={label} whileHover={{ y: -2, rotate: i % 2 === 0 ? -0.5 : 0.5 }}
                            transition={gentleSpring}
                            className="paper-card rounded-xl p-5"
                            style={{ marginTop: i % 2 !== 0 ? '6px' : '0' }}>
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                                style={{ background: 'rgba(124,154,110,0.1)' }}>
                                <Icon size={17} style={{ color: 'var(--accent)' }} />
                            </div>
                            <div className="text-2xl font-bold tracking-tight mb-1"
                                style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>{value}{suffix}</div>
                            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</div>
                        </motion.div>
                    ))}
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                    {/* Score Trend */}
                    <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ ...gentleSpring, delay: 0.2 }}
                        className="lg:col-span-2 paper-card rounded-xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-base font-bold flex items-center gap-2"
                                style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                                <TrendingUp size={16} style={{ color: 'var(--accent)' }} /> Score Trend
                            </h3>
                            <span className="text-xs" style={{ color: 'var(--text-light)' }}>Last 10 sessions</span>
                        </div>
                        {trendData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={200}>
                                <LineChart data={trendData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                                    <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ background: 'var(--paper)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 12 }} />
                                    <Line type="monotone" dataKey="score" stroke="var(--accent)" strokeWidth={2} dot={{ fill: 'var(--accent)', r: 3 }} activeDot={{ r: 5, fill: 'var(--accent)' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-48 flex items-center justify-center text-sm" style={{ color: 'var(--text-light)' }}>Complete interviews to see your score trend</div>
                        )}
                    </motion.div>

                    {/* Weak Topics */}
                    <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ ...gentleSpring, delay: 0.3 }}
                        className="paper-card rounded-xl p-6">
                        <h3 className="text-base font-bold flex items-center gap-2 mb-4"
                            style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                            <AlertTriangle size={16} style={{ color: 'var(--warm)' }} /> Weak Topics
                        </h3>
                        {(data?.weakTopics || []).length > 0 ? (
                            <div className="space-y-3">
                                {(data?.weakTopics || []).slice(0, 5).map(({ topic, score, priority }) => (
                                    <div key={topic}>
                                        <div className="flex items-center justify-between text-xs mb-1">
                                            <span className="capitalize" style={{ color: 'var(--text-secondary)' }}>{topic.replace(/([A-Z])/g, ' $1').trim()}</span>
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                                                style={{
                                                    color: priority === 'High' ? 'var(--danger)' : priority === 'Medium' ? 'var(--warm)' : '#6a7fa8',
                                                    background: priority === 'High' ? 'rgba(192,84,79,0.06)' : priority === 'Medium' ? 'rgba(212,165,116,0.06)' : 'rgba(106,127,168,0.06)',
                                                }}>{priority}</span>
                                        </div>
                                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface)' }}>
                                            <div className="h-full progress-bar-animated rounded-full" style={{ width: `${score}%` }} />
                                        </div>
                                        <div className="text-right text-[10px] mt-0.5" style={{ color: 'var(--text-light)' }}>{score}%</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 text-sm" style={{ color: 'var(--text-light)' }}>
                                <CheckCircle2 size={22} className="mx-auto mb-2" style={{ color: 'var(--accent)' }} />
                                No weak topics detected yet!
                            </div>
                        )}
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                    {/* Skill Heatmap */}
                    <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ ...gentleSpring, delay: 0.35 }}
                        className="lg:col-span-2 paper-card rounded-xl p-6">
                        <h3 className="text-base font-bold flex items-center gap-2 mb-5"
                            style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                            <BarChart2 size={16} style={{ color: 'var(--accent)' }} /> Skill Heatmap
                        </h3>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                            {(data?.heatmap || []).map(({ topic, score, level }) => (
                                <div key={topic}
                                    className={`heatmap-cell rounded-lg p-3 text-center border cursor-default ${LEVEL_COLORS[level]}`}
                                    style={{ background: LEVEL_BG[level] }} title={`${topic}: ${score}%`}>
                                    <div className="text-lg font-bold mb-1" style={{ fontFamily: 'var(--font-heading)' }}>{score}</div>
                                    <div className="text-[9px] leading-tight opacity-70">{topic}</div>
                                    <div className="mt-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.05)' }}>
                                        <div className="h-full rounded-full" style={{ width: `${score}%`, background: SCORE_BG[level] }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center gap-4 mt-4 text-xs" style={{ color: 'var(--text-light)' }}>
                            {Object.entries(SCORE_BG).map(([level, bg]) => (
                                <div key={level} className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 rounded" style={{ background: bg }} />
                                    <span className="capitalize">{level}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Radar */}
                    <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ ...gentleSpring, delay: 0.4 }}
                        className="paper-card rounded-xl p-6">
                        <h3 className="text-base font-bold flex items-center gap-2 mb-2"
                            style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                            <Target size={16} style={{ color: 'var(--accent)' }} /> Skill Radar
                        </h3>
                        {radarData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={220}>
                                <RadarChart data={radarData}>
                                    <PolarGrid stroke="rgba(0,0,0,0.04)" />
                                    <PolarAngleAxis dataKey="topic" tick={{ fill: 'var(--text-muted)', fontSize: 9 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 8 }} />
                                    <Radar dataKey="score" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.1} dot={{ fill: 'var(--accent)', r: 2 }} />
                                </RadarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-48 flex items-center justify-center text-xs" style={{ color: 'var(--text-light)' }}>Complete interviews to generate radar</div>
                        )}
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Recommendations */}
                    <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ ...gentleSpring, delay: 0.45 }}
                        className="paper-card rounded-xl p-6">
                        <h3 className="text-base font-bold flex items-center gap-2 mb-5"
                            style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                            <Sparkles size={16} style={{ color: 'var(--accent)' }} /> Personalized Roadmap
                        </h3>
                        {(data?.recommendations || []).length > 0 ? (
                            <div className="space-y-3">
                                {data?.recommendations.map(({ topic, priority, suggestedDifficulty, message }) => (
                                    <div key={topic} className="flex items-start gap-3 p-3 rounded-lg"
                                        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                                        <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 text-xs font-bold"
                                            style={{
                                                background: priority === 'High' ? 'rgba(192,84,79,0.08)' : priority === 'Medium' ? 'rgba(212,165,116,0.08)' : 'rgba(106,127,168,0.08)',
                                                color: priority === 'High' ? 'var(--danger)' : priority === 'Medium' ? 'var(--warm)' : '#6a7fa8',
                                            }}>{priority[0]}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-sm capitalize" style={{ color: 'var(--text-primary)' }}>{topic.replace(/([A-Z])/g, ' $1').trim()}</div>
                                            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{message}</div>
                                        </div>
                                        <Link href={`/interview?topic=${topic}&difficulty=${suggestedDifficulty}`}
                                            className="btn-tactile flex-shrink-0 p-1.5 rounded-lg"
                                            style={{ background: 'rgba(124,154,110,0.08)', color: 'var(--accent)' }}>
                                            <ChevronRight size={13} />
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 text-sm" style={{ color: 'var(--text-light)' }}>Complete a few interviews to get personalized recommendations</div>
                        )}
                    </motion.div>

                    {/* Recent Sessions */}
                    <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ ...gentleSpring, delay: 0.5 }}
                        className="paper-card rounded-xl p-6">
                        <h3 className="text-base font-bold flex items-center gap-2 mb-5"
                            style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                            <Calendar size={16} style={{ color: 'var(--accent)' }} /> Recent Sessions
                        </h3>
                        {sessions.length > 0 ? (
                            <div className="space-y-3">
                                {sessions.map(session => (
                                    <div key={session._id} className="flex items-center gap-3 p-3 rounded-lg"
                                        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                                        <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 text-xs font-bold"
                                            style={{
                                                background: `${modeColors[session.mode] || 'var(--text-muted)'}12`,
                                                color: modeColors[session.mode] || 'var(--text-muted)',
                                            }}>{session.mode[0]}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{session.mode} · {session.type}</div>
                                            <div className="text-xs flex items-center gap-2" style={{ color: 'var(--text-light)' }}>
                                                <Clock size={10} />
                                                {new Date(session.createdAt).toLocaleDateString()}
                                                {session.duration && <span>· {session.duration}m</span>}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-bold"
                                                style={{ color: session.overallScore >= 70 ? 'var(--accent)' : session.overallScore >= 50 ? 'var(--warm)' : 'var(--danger)' }}>
                                                {session.overallScore || 0}
                                            </div>
                                            <div className="text-[10px]" style={{ color: 'var(--text-light)' }}>/100</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-sm" style={{ color: 'var(--text-light)' }}>
                                <Brain size={26} className="mx-auto mb-2" style={{ opacity: 0.3 }} />
                                No sessions yet. Start your first interview!
                            </div>
                        )}
                        <Link href="/interview"
                            className="btn-tactile mt-4 flex items-center justify-center gap-2 py-3 rounded-lg text-sm"
                            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                            Start New Session <ArrowRight size={13} />
                        </Link>
                    </motion.div>
                </div>
            </div>
        </main>
    );
}
