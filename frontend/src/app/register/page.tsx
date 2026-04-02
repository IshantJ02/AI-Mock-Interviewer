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

    const inputStyle = { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' };
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = 'rgba(124,154,110,0.4)'; };
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = 'var(--border)'; };

    return (
        <main className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ background: 'var(--bg)' }}>
            <div className="absolute inset-0 dot-bg opacity-30" />
            <div className="blob w-[400px] h-[400px] top-0 right-0" style={{ background: 'rgba(124,154,110,0.15)', opacity: 0.12 }} />
            <div className="blob w-[350px] h-[350px] bottom-0 left-0" style={{ background: 'rgba(212,165,116,0.12)', opacity: 0.1, animationDelay: '4s' }} />

            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-10 w-full max-w-md">
                <Link href="/" className="flex items-center justify-center gap-2 mb-10">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white" style={{ background: 'var(--accent)' }}>
                        <Brain size={18} />
                    </div>
                    <span className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                        NextUp<span style={{ color: 'var(--accent)' }}>.</span>ai
                    </span>
                </Link>

                <div className="paper-card rounded-2xl p-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold mb-2 tracking-tight"
                            style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>Create Account</h1>
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Start your interview prep journey today</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="relative">
                            <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-light)' }} />
                            <input type="text" placeholder="Full Name" value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                className="w-full rounded-xl pl-11 pr-4 py-3.5 text-sm focus:outline-none transition-all"
                                style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                        </div>
                        <div className="relative">
                            <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-light)' }} />
                            <input type="email" placeholder="Email Address" value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                                className="w-full rounded-xl pl-11 pr-4 py-3.5 text-sm focus:outline-none transition-all"
                                style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                        </div>
                        <div className="relative">
                            <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-light)' }} />
                            <input type={showPassword ? 'text' : 'password'} placeholder="Password (min 6 chars)"
                                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                                className="w-full rounded-xl pl-11 pr-12 py-3.5 text-sm focus:outline-none transition-all"
                                style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                            <button type="button" onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-light)' }}>
                                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                        </div>
                        <button type="submit" disabled={isLoading}
                            className="btn-tactile w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-white transition-all disabled:opacity-50"
                            style={{ background: 'var(--accent)', boxShadow: '0 2px 12px rgba(124,154,110,0.15)' }}>
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                            ) : (<><Sparkles size={16} /> Create Account <ArrowRight size={15} /></>)}
                        </button>
                    </form>

                    <div className="flex items-center gap-4 my-6">
                        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                        <span className="text-xs" style={{ color: 'var(--text-light)' }}>or</span>
                        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                    </div>
                    <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                        Already have an account?{' '}
                        <Link href="/login" className="font-medium transition-colors" style={{ color: 'var(--accent)' }}>Sign in</Link>
                    </p>
                </div>
            </motion.div>
        </main>
    );
}
