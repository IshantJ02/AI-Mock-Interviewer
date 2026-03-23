'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { Brain, Eye, EyeOff, Sparkles, ArrowRight, User, Mail, Lock } from 'lucide-react';

export default function RegisterPage() {
    const { register, isLoading } = useAuthStore();
    const router = useRouter();
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.password) { toast.error('Please fill in all fields'); return; }
        try {
            await register(form.name, form.email, form.password);
            toast.success('Welcome to NextUp.ai! 🚀');
            router.push('/dashboard');
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed';
            toast.error(message);
        }
    };

    const inputStyle = { background: '#f5f1ea', border: '1px solid #e0dbd2', color: '#2d2926' };
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = 'rgba(124,154,110,0.4)'; };
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = '#e0dbd2'; };

    return (
        <main className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ background: '#faf8f4' }}>
            <div className="absolute inset-0 dot-bg opacity-30" />
            <div className="blob w-[400px] h-[400px] top-0 right-0" style={{ background: '#c4d8b8', opacity: 0.12 }} />
            <div className="blob w-[350px] h-[350px] bottom-0 left-0" style={{ background: '#e8d0b0', opacity: 0.1, animationDelay: '4s' }} />

            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-10 w-full max-w-md">
                <Link href="/" className="flex items-center justify-center gap-2 mb-10">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white" style={{ background: '#7c9a6e' }}>
                        <Brain size={18} />
                    </div>
                    <span className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-heading)', color: '#2d2926' }}>
                        NextUp<span style={{ color: '#7c9a6e' }}>.</span>ai
                    </span>
                </Link>

                <div className="paper-card rounded-2xl p-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold mb-2 tracking-tight"
                            style={{ fontFamily: 'var(--font-heading)', color: '#2d2926' }}>Create Account</h1>
                        <p className="text-sm" style={{ color: '#9e9790' }}>Start your interview prep journey today</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="relative">
                            <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#b8b2aa' }} />
                            <input type="text" placeholder="Full Name" value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                className="w-full rounded-xl pl-11 pr-4 py-3.5 text-sm focus:outline-none transition-all"
                                style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                        </div>
                        <div className="relative">
                            <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#b8b2aa' }} />
                            <input type="email" placeholder="Email Address" value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                                className="w-full rounded-xl pl-11 pr-4 py-3.5 text-sm focus:outline-none transition-all"
                                style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                        </div>
                        <div className="relative">
                            <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#b8b2aa' }} />
                            <input type={showPassword ? 'text' : 'password'} placeholder="Password (min 6 chars)"
                                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                                className="w-full rounded-xl pl-11 pr-12 py-3.5 text-sm focus:outline-none transition-all"
                                style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                            <button type="button" onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: '#b8b2aa' }}>
                                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                        </div>
                        <button type="submit" disabled={isLoading}
                            className="btn-tactile w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-white transition-all disabled:opacity-50"
                            style={{ background: '#7c9a6e', boxShadow: '0 2px 12px rgba(124,154,110,0.15)' }}>
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                            ) : (<><Sparkles size={16} /> Create Account <ArrowRight size={15} /></>)}
                        </button>
                    </form>

                    <div className="flex items-center gap-4 my-6">
                        <div className="flex-1 h-px" style={{ background: '#e0dbd2' }} />
                        <span className="text-xs" style={{ color: '#b8b2aa' }}>or</span>
                        <div className="flex-1 h-px" style={{ background: '#e0dbd2' }} />
                    </div>
                    <p className="text-center text-sm" style={{ color: '#9e9790' }}>
                        Already have an account?{' '}
                        <Link href="/login" className="font-medium transition-colors" style={{ color: '#7c9a6e' }}>Sign in</Link>
                    </p>
                </div>
            </motion.div>
        </main>
    );
}
