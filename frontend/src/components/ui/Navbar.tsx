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
                    background: 'rgba(250, 248, 244, 0.85)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid #e0dbd2',
                    borderRadius: '14px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
                }}
            >
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2.5 group">
                    <div className="relative w-8 h-8">
                        <div className="relative w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: '#7c9a6e' }}>
                            <Brain size={16} className="text-white" />
                        </div>
                    </div>
                    <span className="font-bold text-lg tracking-tight"
                        style={{ fontFamily: 'var(--font-heading)', color: '#2d2926' }}>
                        NextUp<span style={{ color: '#7c9a6e' }}>.</span>ai
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
                                background: pathname === href ? 'rgba(124, 154, 110, 0.1)' : 'transparent',
                                color: pathname === href ? '#5a7e4c' : '#9e9790',
                                border: pathname === href ? '1px solid rgba(124, 154, 110, 0.2)' : '1px solid transparent',
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
                                style={{ background: '#f0ece4', border: '1px solid #e0dbd2' }}>
                                <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold text-white"
                                    style={{ background: '#7c9a6e' }}>
                                    {user?.name?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <span className="text-sm max-w-[100px] truncate"
                                    style={{ color: '#5c5650' }}>{user?.name}</span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="btn-tactile flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all"
                                style={{ color: '#9e9790' }}
                                onMouseEnter={e => { e.currentTarget.style.color = '#c0544f'; e.currentTarget.style.background = 'rgba(192,84,79,0.06)'; }}
                                onMouseLeave={e => { e.currentTarget.style.color = '#9e9790'; e.currentTarget.style.background = 'transparent'; }}
                            >
                                <LogOut size={15} />
                            </button>
                        </>
                    ) : (
                        <>
                            <Link href="/login"
                                className="btn-tactile px-4 py-2 text-sm transition-all"
                                style={{ color: '#5c5650' }}>
                                Login
                            </Link>
                            <Link href="/register"
                                className="btn-tactile flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all text-white"
                                style={{
                                    background: '#7c9a6e',
                                    boxShadow: '0 2px 10px rgba(124,154,110,0.15)',
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
                    className="md:hidden p-2 rounded-xl" style={{ color: '#5c5650' }}>
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
                        background: 'rgba(255, 253, 248, 0.95)',
                        backdropFilter: 'blur(16px)',
                        border: '1px solid #e0dbd2',
                        borderRadius: '14px',
                    }}
                >
                    {isAuthenticated && navItems.map(({ href, label, icon: Icon }) => (
                        <Link key={href} href={href} onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                            style={{ color: '#5c5650' }}>
                            <Icon size={18} />
                            {label}
                        </Link>
                    ))}
                    {isAuthenticated ? (
                        <button onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all w-full"
                            style={{ color: '#c0544f' }}>
                            <LogOut size={18} /> Logout
                        </button>
                    ) : (
                        <div className="space-y-2 pt-2" style={{ borderTop: '1px solid #e0dbd2' }}>
                            <Link href="/login" onClick={() => setMenuOpen(false)}
                                className="block px-4 py-3 text-center rounded-xl" style={{ color: '#5c5650' }}>Login</Link>
                            <Link href="/register" onClick={() => setMenuOpen(false)}
                                className="block px-4 py-3 text-center rounded-xl font-semibold text-white"
                                style={{ background: '#7c9a6e' }}>Get Started</Link>
                        </div>
                    )}
                </motion.div>
            )}
        </motion.nav>
    );
}
