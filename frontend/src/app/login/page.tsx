'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { Brain, Eye, EyeOff, ArrowRight, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
    const { login, isLoading } = useAuthStore();
    const router = useRouter();
    const [form, setForm] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login(form.email, form.password);
            toast.success('Welcome back! 👋');
            router.push('/dashboard');
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed';
            toast.error(message);
        }
    };

    return (
        <main className="min-h-screen bg-gray-950 flex items-center justify-center px-4 relative overflow-hidden">
            <div className="absolute inset-0 grid-bg opacity-20" />
            <div className="blob w-96 h-96 bg-purple-700 bottom-0 right-0 opacity-30" />
            <div className="blob w-96 h-96 bg-cyan-700 top-0 left-0 opacity-20" style={{ animationDelay: '2s' }} />

            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative z-10 w-full max-w-md"
            >
                <Link href="/" className="flex items-center justify-center gap-2 mb-8">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center">
                        <Brain size={22} className="text-white" />
                    </div>
                    <span className="text-2xl font-black gradient-text">NextUp.ai</span>
                </Link>

                <div className="glass-strong rounded-3xl p-8 border border-purple-500/20">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-black text-white mb-2">Welcome Back</h1>
                        <p className="text-gray-400 text-sm">Continue your interview prep</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="relative">
                            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="email"
                                placeholder="Email Address"
                                value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:bg-purple-500/5 transition-all"
                            />
                        </div>

                        <div className="relative">
                            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Password"
                                value={form.password}
                                onChange={e => setForm({ ...form, password: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-12 py-3.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:bg-purple-500/5 transition-all"
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-2xl text-white font-bold hover:opacity-90 transition-all glow-purple disabled:opacity-50"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="flex items-center gap-4 my-6">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-gray-500 text-xs">or</span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    <p className="text-center text-gray-400 text-sm">
                        Don&apos;t have an account?{' '}
                        <Link href="/register" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
                            Create one free
                        </Link>
                    </p>
                </div>
            </motion.div>
        </main>
    );
}
