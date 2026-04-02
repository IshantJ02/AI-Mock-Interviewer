'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useState } from 'react';
import {
    Brain, LayoutDashboard, Code2, LogOut,
    Menu, X, ChevronRight, Sparkles
} from 'lucide-react';

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/interview', label: 'Practice', icon: Code2 },
];

export default function Navbar() {
    const { user, logout, isAuthenticated } = useAuthStore();
    const pathname = usePathname();
    const router = useRouter();
    const [menuOpen, setMenuOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    return (
        <motion.nav
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-0 left-0 right-0 z-50 px-4 py-4"
        >
            <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3.5"
                style={{
                    background: 'rgba(15, 17, 21, 0.75)',
                    backdropFilter: 'blur(16px) saturate(1.4)',
                    border: '1px solid rgba(124, 154, 110, 0.12)',
                    borderRadius: '16px',
                    boxShadow: '0 4px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)',
                }}
            >
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2.5 group">
                    <div className="relative w-8 h-8">
                        <div className="relative w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: 'var(--accent)', boxShadow: '0 0 12px rgba(124,154,110,0.3)' }}>
                            <Brain size={16} className="text-white" />
                        </div>
                    </div>
                    <span className="font-bold text-lg tracking-tight"
                        style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                        NextUp<span style={{ color: 'var(--accent)' }}>.</span>ai
                    </span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-1">
                    {isAuthenticated && navItems.map(({ href, label, icon: Icon }) => (
                        <Link
                            key={href}
                            href={href}
                            className="btn-tactile flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                            style={{
                                background: pathname === href ? 'var(--accent-light)' : 'transparent',
                                color: pathname === href ? 'var(--accent)' : 'var(--text-muted)',
                                border: pathname === href ? '1px solid rgba(124, 154, 110, 0.25)' : '1px solid transparent',
                            }}
                        >
                            <Icon size={15} />
                            {label}
                        </Link>
                    ))}
                </div>

                {/* Right side */}
                <div className="hidden md:flex items-center gap-3">
                    {isAuthenticated ? (
                        <>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                                <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold text-white"
                                    style={{ background: 'var(--accent)' }}>
                                    {user?.name?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <span className="text-sm max-w-[100px] truncate"
                                    style={{ color: 'var(--text-secondary)' }}>{user?.name}</span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="btn-tactile flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all"
                                style={{ color: 'var(--text-muted)' }}
                                onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'var(--danger-light)'; }}
                                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
                            >
                                <LogOut size={15} />
                            </button>
                        </>
                    ) : (
                        <>
                            <Link href="/login"
                                className="btn-tactile px-4 py-2 text-sm transition-all"
                                style={{ color: 'var(--text-secondary)' }}>
                                Login
                            </Link>
                            <Link href="/register"
                                className="btn-tactile flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all text-white"
                                style={{
                                    background: 'var(--accent)',
                                    boxShadow: '0 2px 16px rgba(124,154,110,0.25)',
                                }}>
                                <Sparkles size={13} />
                                Get Started
                                <ChevronRight size={13} />
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile Toggle */}
                <button onClick={() => setMenuOpen(!menuOpen)}
                    className="md:hidden p-2 rounded-xl" style={{ color: 'var(--text-secondary)' }}>
                    {menuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>

            {/* Mobile Menu */}
            {menuOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="mt-2 mx-4 p-4 space-y-2 md:hidden"
                    style={{
                        background: 'rgba(22, 24, 29, 0.95)',
                        backdropFilter: 'blur(16px)',
                        border: '1px solid var(--border)',
                        borderRadius: '14px',
                    }}
                >
                    {isAuthenticated && navItems.map(({ href, label, icon: Icon }) => (
                        <Link key={href} href={href} onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                            style={{ color: 'var(--text-secondary)' }}>
                            <Icon size={18} />
                            {label}
                        </Link>
                    ))}
                    {isAuthenticated ? (
                        <button onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all w-full"
                            style={{ color: 'var(--danger)' }}>
                            <LogOut size={18} /> Logout
                        </button>
                    ) : (
                        <div className="space-y-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                            <Link href="/login" onClick={() => setMenuOpen(false)}
                                className="block px-4 py-3 text-center rounded-xl" style={{ color: 'var(--text-secondary)' }}>Login</Link>
                            <Link href="/register" onClick={() => setMenuOpen(false)}
                                className="block px-4 py-3 text-center rounded-xl font-semibold text-white"
                                style={{ background: 'var(--accent)' }}>Get Started</Link>
                        </div>
                    )}
                </motion.div>
            )}
        </motion.nav>
    );
}
