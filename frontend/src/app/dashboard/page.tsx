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
    weak: 'text-[#c0544f] border-[#c0544f]/20',
    developing: 'text-[#d4a574] border-[#d4a574]/20',
    good: 'text-[#6a7fa8] border-[#6a7fa8]/20',
    excellent: 'text-[#7c9a6e] border-[#7c9a6e]/20',
};
const LEVEL_BG: Record<string, string> = {
    weak: 'rgba(192,84,79,0.08)',
    developing: 'rgba(212,165,116,0.08)',
    good: 'rgba(106,127,168,0.08)',
    excellent: 'rgba(124,154,110,0.08)',
};
const SCORE_BG: Record<string, string> = {
    weak: '#c0544f',
    developing: '#d4a574',
    good: '#6a7fa8',
    excellent: '#7c9a6e',
};

const gentleSpring = { type: 'spring' as const, stiffness: 60, damping: 25, mass: 1.2 };

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
        } catch (err) { console.error('Dashboard fetch error:', err); }
        finally { setLoading(false); }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#faf8f4' }}>
                <Navbar />
                <div className="text-center">
                    <Loader2 size={36} className="animate-spin mx-auto mb-4" style={{ color: '#7c9a6e' }} />
                    <p style={{ color: '#9e9790' }}>Loading your dashboard...</p>
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

    const modeColors: Record<string, string> = { Google: '#5a8f4c', Amazon: '#c08a4f', Meta: '#6a7fa8', Startup: '#b07070' };

    return (
        <main className="min-h-screen pb-12 relative overflow-hidden" style={{ background: '#faf8f4' }}>
            <Navbar />
            <div className="absolute inset-0 dot-bg opacity-10" />
            <div className="blob w-[400px] h-[400px] top-0 right-0" style={{ background: '#c4d8b8', opacity: 0.08 }} />

            <div className="max-w-7xl mx-auto px-6 pt-28 relative z-10">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={gentleSpring}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-1"
                            style={{ fontFamily: 'var(--font-heading)', color: '#2d2926' }}>
                            Welcome back, <span className="hand-underline" style={{ color: '#5a7e4c' }}>{user?.name || 'Coder'}</span> 👋
                        </h1>
                        <p style={{ color: '#9e9790' }}>Track your progress and crush your next interview</p>
                    </div>
                    <Link href="/interview"
                        className="btn-tactile flex items-center gap-3 px-6 py-3 rounded-xl font-bold text-white"
                        style={{ background: '#7c9a6e', boxShadow: '0 2px 12px rgba(124,154,110,0.15)' }}>
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
                                <Icon size={17} style={{ color: '#7c9a6e' }} />
                            </div>
                            <div className="text-2xl font-bold tracking-tight mb-1"
                                style={{ fontFamily: 'var(--font-heading)', color: '#2d2926' }}>{value}{suffix}</div>
                            <div className="text-xs" style={{ color: '#9e9790' }}>{label}</div>
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
                                style={{ fontFamily: 'var(--font-heading)', color: '#2d2926' }}>
                                <TrendingUp size={16} style={{ color: '#7c9a6e' }} /> Score Trend
                            </h3>
                            <span className="text-xs" style={{ color: '#b8b2aa' }}>Last 10 sessions</span>
                        </div>
                        {trendData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={200}>
                                <LineChart data={trendData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                                    <XAxis dataKey="date" tick={{ fill: '#9e9790', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis domain={[0, 100]} tick={{ fill: '#9e9790', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ background: '#fffdf8', border: '1px solid #e0dbd2', borderRadius: 10, color: '#2d2926', fontSize: 12 }} />
                                    <Line type="monotone" dataKey="score" stroke="#7c9a6e" strokeWidth={2} dot={{ fill: '#7c9a6e', r: 3 }} activeDot={{ r: 5, fill: '#5a7e4c' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-48 flex items-center justify-center text-sm" style={{ color: '#b8b2aa' }}>Complete interviews to see your score trend</div>
                        )}
                    </motion.div>

                    {/* Weak Topics */}
                    <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ ...gentleSpring, delay: 0.3 }}
                        className="paper-card rounded-xl p-6">
                        <h3 className="text-base font-bold flex items-center gap-2 mb-4"
                            style={{ fontFamily: 'var(--font-heading)', color: '#2d2926' }}>
                            <AlertTriangle size={16} style={{ color: '#d4a574' }} /> Weak Topics
                        </h3>
                        {(data?.weakTopics || []).length > 0 ? (
                            <div className="space-y-3">
                                {(data?.weakTopics || []).slice(0, 5).map(({ topic, score, priority }) => (
                                    <div key={topic}>
                                        <div className="flex items-center justify-between text-xs mb-1">
                                            <span className="capitalize" style={{ color: '#5c5650' }}>{topic.replace(/([A-Z])/g, ' $1').trim()}</span>
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                                                style={{
                                                    color: priority === 'High' ? '#c0544f' : priority === 'Medium' ? '#d4a574' : '#6a7fa8',
                                                    background: priority === 'High' ? 'rgba(192,84,79,0.06)' : priority === 'Medium' ? 'rgba(212,165,116,0.06)' : 'rgba(106,127,168,0.06)',
                                                }}>{priority}</span>
                                        </div>
                                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#f0ece4' }}>
                                            <div className="h-full progress-bar-animated rounded-full" style={{ width: `${score}%` }} />
                                        </div>
                                        <div className="text-right text-[10px] mt-0.5" style={{ color: '#b8b2aa' }}>{score}%</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 text-sm" style={{ color: '#b8b2aa' }}>
                                <CheckCircle2 size={22} className="mx-auto mb-2" style={{ color: '#7c9a6e' }} />
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
                            style={{ fontFamily: 'var(--font-heading)', color: '#2d2926' }}>
                            <BarChart2 size={16} style={{ color: '#7c9a6e' }} /> Skill Heatmap
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
                        <div className="flex items-center gap-4 mt-4 text-xs" style={{ color: '#b8b2aa' }}>
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
                            style={{ fontFamily: 'var(--font-heading)', color: '#2d2926' }}>
                            <Target size={16} style={{ color: '#7c9a6e' }} /> Skill Radar
                        </h3>
                        {radarData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={220}>
                                <RadarChart data={radarData}>
                                    <PolarGrid stroke="rgba(0,0,0,0.04)" />
                                    <PolarAngleAxis dataKey="topic" tick={{ fill: '#9e9790', fontSize: 9 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#9e9790', fontSize: 8 }} />
                                    <Radar dataKey="score" stroke="#7c9a6e" fill="#7c9a6e" fillOpacity={0.1} dot={{ fill: '#7c9a6e', r: 2 }} />
                                </RadarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-48 flex items-center justify-center text-xs" style={{ color: '#b8b2aa' }}>Complete interviews to generate radar</div>
                        )}
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Recommendations */}
                    <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ ...gentleSpring, delay: 0.45 }}
                        className="paper-card rounded-xl p-6">
                        <h3 className="text-base font-bold flex items-center gap-2 mb-5"
                            style={{ fontFamily: 'var(--font-heading)', color: '#2d2926' }}>
                            <Sparkles size={16} style={{ color: '#7c9a6e' }} /> Personalized Roadmap
                        </h3>
                        {(data?.recommendations || []).length > 0 ? (
                            <div className="space-y-3">
                                {data?.recommendations.map(({ topic, priority, suggestedDifficulty, message }) => (
                                    <div key={topic} className="flex items-start gap-3 p-3 rounded-lg"
                                        style={{ background: '#f5f1ea', border: '1px solid #e0dbd2' }}>
                                        <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 text-xs font-bold"
                                            style={{
                                                background: priority === 'High' ? 'rgba(192,84,79,0.08)' : priority === 'Medium' ? 'rgba(212,165,116,0.08)' : 'rgba(106,127,168,0.08)',
                                                color: priority === 'High' ? '#c0544f' : priority === 'Medium' ? '#d4a574' : '#6a7fa8',
                                            }}>{priority[0]}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-sm capitalize" style={{ color: '#2d2926' }}>{topic.replace(/([A-Z])/g, ' $1').trim()}</div>
                                            <div className="text-xs" style={{ color: '#9e9790' }}>{message}</div>
                                        </div>
                                        <Link href={`/interview?topic=${topic}&difficulty=${suggestedDifficulty}`}
                                            className="btn-tactile flex-shrink-0 p-1.5 rounded-lg"
                                            style={{ background: 'rgba(124,154,110,0.08)', color: '#7c9a6e' }}>
                                            <ChevronRight size={13} />
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 text-sm" style={{ color: '#b8b2aa' }}>Complete a few interviews to get personalized recommendations</div>
                        )}
                    </motion.div>

                    {/* Recent Sessions */}
                    <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ ...gentleSpring, delay: 0.5 }}
                        className="paper-card rounded-xl p-6">
                        <h3 className="text-base font-bold flex items-center gap-2 mb-5"
                            style={{ fontFamily: 'var(--font-heading)', color: '#2d2926' }}>
                            <Calendar size={16} style={{ color: '#7c9a6e' }} /> Recent Sessions
                        </h3>
                        {sessions.length > 0 ? (
                            <div className="space-y-3">
                                {sessions.map(session => (
                                    <div key={session._id} className="flex items-center gap-3 p-3 rounded-lg"
                                        style={{ background: '#f5f1ea', border: '1px solid #e0dbd2' }}>
                                        <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 text-xs font-bold"
                                            style={{
                                                background: `${modeColors[session.mode] || '#9e9790'}12`,
                                                color: modeColors[session.mode] || '#9e9790',
                                            }}>{session.mode[0]}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium" style={{ color: '#2d2926' }}>{session.mode} · {session.type}</div>
                                            <div className="text-xs flex items-center gap-2" style={{ color: '#b8b2aa' }}>
                                                <Clock size={10} />
                                                {new Date(session.createdAt).toLocaleDateString()}
                                                {session.duration && <span>· {session.duration}m</span>}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-bold"
                                                style={{ color: session.overallScore >= 70 ? '#7c9a6e' : session.overallScore >= 50 ? '#d4a574' : '#c0544f' }}>
                                                {session.overallScore || 0}
                                            </div>
                                            <div className="text-[10px]" style={{ color: '#b8b2aa' }}>/100</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-sm" style={{ color: '#b8b2aa' }}>
                                <Brain size={26} className="mx-auto mb-2" style={{ opacity: 0.3 }} />
                                No sessions yet. Start your first interview!
                            </div>
                        )}
                        <Link href="/interview"
                            className="btn-tactile mt-4 flex items-center justify-center gap-2 py-3 rounded-lg text-sm"
                            style={{ background: '#f5f1ea', border: '1px solid #e0dbd2', color: '#5c5650' }}>
                            Start New Session <ArrowRight size={13} />
                        </Link>
                    </motion.div>
                </div>
            </div>
        </main>
    );
}
