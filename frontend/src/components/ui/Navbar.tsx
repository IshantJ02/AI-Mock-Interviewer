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
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-0 left-0 right-0 z-50 px-4 py-3"
        >
            <div className="max-w-7xl mx-auto glass rounded-2xl px-6 py-3 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="relative w-8 h-8">
                        <div className="absolute inset-0 bg-purple-500 rounded-lg blur-lg opacity-60 group-hover:opacity-100 transition-opacity" />
                        <div className="relative bg-gradient-to-br from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center w-8 h-8">
                            <Brain size={18} className="text-white" />
                        </div>
                    </div>
                    <span className="font-bold text-lg gradient-text">NextUp.ai</span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-1">
                    {isAuthenticated && navItems.map(({ href, label, icon: Icon }) => (
                        <Link
                            key={href}
                            href={href}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${pathname === href
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <Icon size={16} />
                            {label}
                        </Link>
                    ))}
                </div>

                {/* Right Actions */}
                <div className="hidden md:flex items-center gap-3">
                    {isAuthenticated ? (
                        <>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-xs font-bold">
                                    {user?.name?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <span className="text-sm text-gray-300 max-w-[120px] truncate">{user?.name}</span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                            >
                                <LogOut size={16} />
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                href="/login"
                                className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
                            >
                                Login
                            </Link>
                            <Link
                                href="/register"
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-xl text-sm font-medium text-white hover:opacity-90 transition-all glow-purple"
                            >
                                <Sparkles size={14} />
                                Get Started
                                <ChevronRight size={14} />
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="md:hidden p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                >
                    {menuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>

            {/* Mobile Menu */}
            {menuOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 mx-4 glass rounded-2xl p-4 space-y-2 md:hidden"
                >
                    {isAuthenticated && navItems.map(({ href, label, icon: Icon }) => (
                        <Link
                            key={href}
                            href={href}
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-all"
                        >
                            <Icon size={18} />
                            {label}
                        </Link>
                    ))}
                    {isAuthenticated ? (
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all w-full"
                        >
                            <LogOut size={18} />
                            Logout
                        </button>
                    ) : (
                        <div className="space-y-2 pt-2 border-t border-white/10">
                            <Link href="/login" onClick={() => setMenuOpen(false)} className="block px-4 py-3 text-center rounded-xl text-gray-300 hover:bg-white/5">Login</Link>
                            <Link href="/register" onClick={() => setMenuOpen(false)} className="block px-4 py-3 text-center rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-medium">Get Started</Link>
                        </div>
                    )}
                </motion.div>
            )}
        </motion.nav>
    );
}
