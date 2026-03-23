'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Navbar from '@/components/ui/Navbar';

import {
  Brain, Code2, Mic, BarChart3, Zap, Shield,
  ChevronRight, Star, ArrowRight, Terminal,
  Target, TrendingUp, Users, Sparkles, Play,
  CheckCircle2, Globe, Lock, Cpu, BookOpen,
  PenTool, Coffee
} from 'lucide-react';

const HeroBackground = dynamic(() => import('@/components/three/HeroBackground'), { ssr: false });

const COMPANY_MODES = [
  { name: 'Google', icon: '🔍', accent: '#5a8f4c', desc: 'Optimization & edge cases mastery', traits: ['Hard algorithms', 'Big-O proof', 'System Design'] },
  { name: 'Amazon', icon: '📦', accent: '#c08a4f', desc: 'Leadership principles + scalability', traits: ['LP questions', 'Scalable design', 'Real-world impact'] },
  { name: 'Meta', icon: '⚡', accent: '#6a7fa8', desc: 'Product thinking at scale', traits: ['Social scale', 'Product intuition', 'Data structures'] },
  { name: 'Startup', icon: '🚀', accent: '#b07070', desc: 'Ship fast, practical trade-offs', traits: ['Pragmatic code', 'Full-stack', 'Product sense'] },
];

const FEATURES = [
  { icon: Brain, title: 'AI-Powered Interviews', desc: 'GPT-4 generates company-specific questions, evaluates your code, and gives real-time feedback like a senior engineer.' },
  { icon: Mic, title: 'Voice Interview Mode', desc: 'Speak your answers aloud. Our AI listens, transcribes, and evaluates your communication in real-time.' },
  { icon: Code2, title: 'Live Code Execution', desc: 'Run C++, Java, and Python in sandboxed Docker containers. 2-second timeout. Zero setup required.' },
  { icon: BarChart3, title: 'Weakness Detection', desc: 'AI tracks your performance across 15 DSA topics and builds a personalized practice roadmap.' },
  { icon: Target, title: 'Company Mode AI', desc: 'Switch between Google, Amazon, Meta, and Startup modes. The AI\'s personality and focus changes completely.' },
  { icon: TrendingUp, title: 'Progress Analytics', desc: 'Skill heatmaps, score trends, and topic mastery graphs give you a 360° view of your growth.' },
];

const STATS = [
  { value: '50K+', label: 'Interviews Conducted', icon: Users },
  { value: '94%', label: 'Offer Rate', icon: Star },
  { value: '15+', label: 'DSA Topics', icon: Target },
  { value: '<2s', label: 'Code Execution', icon: Zap },
];

const TESTIMONIALS = [
  { name: 'Aryan Mehta', role: 'SDE @ Google', avatar: 'A', rating: 5, text: 'NextUp.ai\'s Google mode is insanely accurate. The follow-up questions were exactly what my real interviewer asked. Got the offer in 3 weeks!' },
  { name: 'Priya Sharma', role: 'SWE @ Amazon', avatar: 'P', rating: 5, text: 'The weakness detection helped me realize my DP skills were terrible. 2 weeks of focused practice and I cleared all 4 Amazon rounds.' },
  { name: 'Rahul Singh', role: 'Engineer @ Meta', avatar: 'R', rating: 5, text: 'Voice mode is a game changer. I used to panic in interviews. Practicing with the AI voice interviewer completely cured my anxiety.' },
];

const TOPICS = ['Arrays', 'DP', 'Trees', 'Graphs', 'Sliding Window', 'Binary Search', 'Recursion', 'Heaps', 'Greedy', 'Backtracking', 'Two Pointers', 'Hash Maps'];

const gentleSpring = { type: 'spring' as const, stiffness: 60, damping: 25, mass: 1.2 };
const softSpring = { type: 'spring' as const, stiffness: 50, damping: 22, mass: 1 };

export default function HomePage() {
  const [activeCompany, setActiveCompany] = useState(0);
  const [typedText, setTypedText] = useState('');
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '15%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  // Typewriter
  const phrases = ['Google SWE Interview', 'Amazon SDE Round', 'Meta Technical Screen', 'DSA Mastery'];
  useEffect(() => {
    let i = 0, j = 0, deleting = false;
    const type = () => {
      const current = phrases[i % phrases.length];
      if (!deleting) {
        setTypedText(current.slice(0, j + 1));
        j++;
        if (j === current.length) { deleting = true; setTimeout(type, 2000); return; }
      } else {
        setTypedText(current.slice(0, j - 1));
        j--;
        if (j === 0) { deleting = false; i++; }
      }
      setTimeout(type, deleting ? 40 : 80);
    };
    const t = setTimeout(type, 800);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line

  useEffect(() => {
    const interval = setInterval(() => setActiveCompany(p => (p + 1) % COMPANY_MODES.length), 4500);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen overflow-x-hidden relative" style={{ background: '#faf8f4' }}>

      <Navbar />

      {/* ── Hero Section ─────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden">
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="absolute inset-0">
          <HeroBackground />
        </motion.div>

        {/* Subtle warm blobs */}
        <div className="blob w-[400px] h-[400px] top-20 -right-20" style={{ background: '#c4d8b8', opacity: 0.15 }} />
        <div className="blob w-[350px] h-[350px] bottom-20 -left-20" style={{ background: '#e8d0b0', opacity: 0.12, animationDelay: '6s' }} />

        <div className="relative z-10 max-w-6xl mx-auto px-6 pt-32 pb-24 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7">
              {/* Handwritten annotation */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...gentleSpring, delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm mb-8"
                style={{
                  background: 'rgba(124, 154, 110, 0.08)',
                  border: '1px solid rgba(124, 154, 110, 0.15)',
                  color: '#5a7e4c',
                }}
              >
                <Coffee size={14} />
                <span style={{ fontFamily: 'var(--font-hand)', fontSize: '1rem', fontWeight: 600 }}>
                  Your late-night study companion ✨
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...softSpring, delay: 0.3 }}
                className="mb-6 leading-[1.05] tracking-tight"
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'clamp(2.8rem, 6vw, 5.5rem)',
                  fontWeight: 700,
                  color: '#2d2926',
                }}
              >
                Ace Your
                <br />
                <span className="hand-underline" style={{ color: '#5a7e4c' }}>{typedText}</span>
                <span className="animate-pulse" style={{ color: '#7c9a6e', fontWeight: 300 }}>|</span>
              </motion.h1>

              {/* Handwritten note */}
              <motion.div
                initial={{ opacity: 0, rotate: -3 }}
                animate={{ opacity: 1, rotate: -1.5 }}
                transition={{ ...gentleSpring, delay: 0.45 }}
                className="mb-6 inline-block"
              >
                <span style={{
                  fontFamily: 'var(--font-hand)',
                  fontSize: '1.3rem',
                  color: '#d4a574',
                  fontWeight: 600,
                }}>
                  ← practice makes perfect!
                </span>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...gentleSpring, delay: 0.5 }}
                className="text-lg max-w-lg mb-10 leading-relaxed"
                style={{ color: '#6b6560' }}
              >
                AI-powered mock interviews with live code execution,
                voice mode, and real-time feedback.{' '}
                <span className="highlight-marker" style={{ color: '#2d2926' }}>Train like the pros.</span>
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...gentleSpring, delay: 0.6 }}
                className="flex flex-col sm:flex-row items-start gap-4"
              >
                <Link href="/register"
                  className="btn-tactile group flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-lg text-white"
                  style={{
                    background: '#7c9a6e',
                    boxShadow: '0 4px 20px rgba(124,154,110,0.2)',
                  }}>
                  <PenTool size={17} />
                  Start Free Interview
                  <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/login"
                  className="btn-tactile flex items-center gap-3 px-7 py-4 rounded-2xl font-medium text-base transition-all"
                  style={{
                    background: '#f0ece4',
                    color: '#5c5650',
                    border: '1px solid #e0dbd2',
                  }}>
                  <Play size={13} />
                  Watch Demo
                </Link>
              </motion.div>
            </div>

            {/* Stats — look like sticky notes/cards */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...softSpring, delay: 0.8 }}
              className="lg:col-span-5 hidden lg:block"
            >
              <div className="grid grid-cols-2 gap-4 ml-6">
                {STATS.map(({ value, label, icon: Icon }, i) => (
                  <motion.div
                    key={label}
                    whileHover={{ y: -3, rotate: i % 2 === 0 ? 1 : -1 }}
                    transition={gentleSpring}
                    className="paper-card p-5 text-center"
                    style={{
                      borderRadius: '14px',
                      marginTop: i % 2 !== 0 ? '16px' : '0',
                      transform: `rotate(${i % 2 === 0 ? -0.8 : 0.5}deg)`,
                    }}
                  >
                    <Icon size={17} className="mx-auto mb-3" style={{ color: '#7c9a6e' }} />
                    <div className="text-2xl font-bold tracking-tight mb-1"
                      style={{ fontFamily: 'var(--font-heading)', color: '#2d2926' }}>{value}</div>
                    <div className="text-xs" style={{ color: '#9e9790' }}>{label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Mobile stats */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...gentleSpring, delay: 0.9 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-12 lg:hidden"
          >
            {STATS.map(({ value, label, icon: Icon }) => (
              <div key={label} className="paper-card p-4 rounded-xl text-center">
                <Icon size={15} className="mx-auto mb-2" style={{ color: '#7c9a6e' }} />
                <div className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>{value}</div>
                <div className="text-xs" style={{ color: '#9e9790' }}>{label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5 }}
          className="absolute bottom-10 left-8 flex flex-col items-center gap-2 text-xs"
          style={{ color: '#b8b2aa' }}
        >
          <span style={{ fontFamily: 'var(--font-hand)', fontSize: '0.9rem' }}>scroll down</span>
          <div className="w-px h-10" style={{ background: 'linear-gradient(to bottom, #d4cec3, transparent)' }} />
        </motion.div>
      </section>

      <div className="section-divider mx-auto max-w-4xl" />

      {/* ── Company Modes ────────────────────────────────────── */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 dot-bg opacity-30" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-14 items-end">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={softSpring}
              className="lg:col-span-7"
            >
              <span style={{ fontFamily: 'var(--font-hand)', fontSize: '1.2rem', color: '#d4a574' }}>
                pick your battlefield 🎯
              </span>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.1] mt-2"
                style={{ fontFamily: 'var(--font-heading)', color: '#2d2926' }}>
                Train for{' '}
                <span className="hand-underline" style={{ color: '#5a7e4c' }}>Any Company</span>
              </h2>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ ...softSpring, delay: 0.1 }}
              className="lg:col-span-5"
            >
              <p className="text-base leading-relaxed" style={{ color: '#9e9790' }}>
                Our AI adapts its personality, difficulty, and focus based on your target company.
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {COMPANY_MODES.map((company, i) => (
              <motion.div
                key={company.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ ...gentleSpring, delay: i * 0.1 }}
                whileHover={{ y: -5, rotate: i % 2 === 0 ? -0.5 : 0.5 }}
                onClick={() => setActiveCompany(i)}
                className={`mode-card paper-card rounded-2xl p-6 cursor-pointer ${activeCompany === i ? 'selected' : ''}`}
                style={{
                  marginTop: i % 2 !== 0 ? '12px' : '0',
                  transform: `rotate(${i === 1 ? 0.5 : i === 2 ? -0.3 : 0}deg)`,
                }}
              >
                <div className="text-2xl mb-3">{company.icon}</div>
                <h3 className="text-lg font-bold mb-2" style={{ fontFamily: 'var(--font-heading)', color: '#2d2926' }}>
                  {company.name}
                </h3>
                <p className="text-sm mb-4" style={{ color: '#9e9790' }}>{company.desc}</p>
                <div className="space-y-1.5">
                  {company.traits.map(trait => (
                    <div key={trait} className="flex items-center gap-2 text-xs" style={{ color: '#6b6560' }}>
                      <CheckCircle2 size={11} style={{ color: '#7c9a6e' }} />
                      {trait}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Active preview */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCompany}
              initial={{ opacity: 0, y: 15, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={gentleSpring}
              className="mt-6 paper-card rounded-2xl p-7"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xl">{COMPANY_MODES[activeCompany].icon}</span>
                <div>
                  <h4 className="text-sm font-bold" style={{ fontFamily: 'var(--font-heading)', color: '#2d2926' }}>
                    {COMPANY_MODES[activeCompany].name} Mode Active
                  </h4>
                  <p className="text-xs" style={{ color: '#9e9790' }}>AI personality loaded</p>
                </div>
                <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full"
                  style={{ background: 'rgba(124,154,110,0.08)', border: '1px solid rgba(124,154,110,0.15)' }}>
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#7c9a6e' }} />
                  <span className="text-xs" style={{ color: '#7c9a6e' }}>Active</span>
                </div>
              </div>
              <div className="rounded-xl p-4 font-mono text-sm"
                style={{ background: '#f5f1ea', border: '1px solid #e0dbd2', color: '#6b6560' }}>
                <span style={{ color: '#7c9a6e', fontWeight: 600 }}>AI Interviewer:</span>{' '}
                <span style={{ color: '#5c5650' }}>
                  {activeCompany === 0 && "Let's dive into your solution. What's the time complexity, and can you prove it's optimal?"}
                  {activeCompany === 1 && "How does this solution scale to 100M users? Think about our Leadership Principle: Think Big."}
                  {activeCompany === 2 && "How would this feature impact 3 billion users? What are the product trade-offs?"}
                  {activeCompany === 3 && "Good enough solution! Can we ship this in a week? What would you cut for the MVP?"}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      <div className="section-divider mx-auto max-w-4xl" />

      {/* ── Features ─────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={softSpring}
            className="mb-14"
          >
            <span style={{ fontFamily: 'var(--font-hand)', fontSize: '1.2rem', color: '#d4a574' }}>
              everything in one place 📚
            </span>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mt-2"
              style={{ fontFamily: 'var(--font-heading)', color: '#2d2926' }}>
              Everything You Need to{' '}
              <span className="highlight-marker">Get Hired</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ ...gentleSpring, delay: i * 0.07 }}
                whileHover={{ y: -3, rotate: -0.5 }}
                className="group paper-card rounded-2xl p-7"
                style={{
                  marginTop: (i === 1 || i === 4) ? '10px' : '0',
                  transform: `rotate(${i % 3 === 1 ? 0.3 : i % 3 === 2 ? -0.2 : 0}deg)`,
                }}
              >
                <div className="w-11 h-11 rounded-xl mb-5 flex items-center justify-center group-hover:scale-105 transition-transform"
                  style={{ background: 'rgba(124, 154, 110, 0.1)', border: '1px solid rgba(124, 154, 110, 0.12)' }}>
                  <Icon size={20} style={{ color: '#7c9a6e' }} />
                </div>
                <h3 className="text-lg font-bold mb-3"
                  style={{ fontFamily: 'var(--font-heading)', color: '#2d2926' }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#9e9790' }}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider mx-auto max-w-4xl" />

      {/* ── DSA Topics ───────────────────────────────────────── */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="blob w-[400px] h-[400px] top-10 right-0" style={{ background: '#d4e5ca', opacity: 0.1 }} />
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={softSpring}
            className="mb-10"
          >
            <span style={{ fontFamily: 'var(--font-hand)', fontSize: '1.2rem', color: '#d4a574' }}>
              from easy to hard 📝
            </span>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mt-2"
              style={{ fontFamily: 'var(--font-heading)', color: '#2d2926' }}>
              <span className="highlight-marker">15 DSA Topics</span> Covered
            </h2>
          </motion.div>
          <div className="flex flex-wrap gap-3">
            {TOPICS.map((topic, i) => (
              <motion.div
                key={topic}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ ...gentleSpring, delay: i * 0.04 }}
                whileHover={{ scale: 1.06, y: -2, rotate: -1 }}
                className="px-5 py-2.5 rounded-xl text-sm font-medium cursor-default paper-card"
                style={{
                  color: '#5c5650',
                  marginTop: i % 3 === 1 ? '6px' : '0',
                }}
              >
                {topic}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider mx-auto max-w-4xl" />

      {/* ── Code Execution — Split ────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={softSpring}
              className="lg:col-span-5"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm mb-6"
                style={{ background: 'rgba(124,154,110,0.08)', border: '1px solid rgba(124,154,110,0.12)', color: '#5a7e4c' }}>
                <Terminal size={13} />
                Docker Sandbox · 2s Timeout
              </div>
              <h2 className="text-3xl font-bold mb-5 tracking-tight"
                style={{ fontFamily: 'var(--font-heading)', color: '#2d2926' }}>
                Run Code in{' '}
                <span style={{ fontFamily: 'var(--font-hand)', fontSize: '2.2rem', color: '#d4a574' }}>Seconds</span>
              </h2>
              <p className="mb-8 leading-relaxed" style={{ color: '#9e9790' }}>
                Write Python, C++, or Java directly in the browser. Each execution runs in an isolated Docker container — completely secure.
              </p>
              <div className="space-y-3">
                {[
                  { icon: Shield, text: 'Isolated Docker containers' },
                  { icon: Zap, text: '2-second time limit enforced' },
                  { icon: Lock, text: 'No network or filesystem access' },
                  { icon: Cpu, text: '64MB memory limit per run' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3 text-sm" style={{ color: '#5c5650' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: 'rgba(124,154,110,0.08)', border: '1px solid rgba(124,154,110,0.1)' }}>
                      <Icon size={14} style={{ color: '#7c9a6e' }} />
                    </div>
                    {text}
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={softSpring}
              className="lg:col-span-7 paper-card rounded-2xl overflow-hidden"
              style={{ transform: 'rotate(-0.5deg)' }}
            >
              <div className="flex items-center gap-2 px-5 py-3" style={{ borderBottom: '1px solid #e0dbd2' }}>
                <div className="w-3 h-3 rounded-full" style={{ background: '#c0544f' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: '#d4a574' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: '#7c9a6e' }} />
                <span className="ml-3 text-xs font-mono" style={{ color: '#b8b2aa' }}>solution.py</span>
              </div>
              <div className="p-6 font-mono text-sm" style={{ background: '#fefcf5' }}>
                <div className="text-xs mb-3" style={{ color: '#b8b2aa' }}># Two Sum · O(n) solution</div>
                <div><span style={{ color: '#7c9a6e' }}>def</span> <span style={{ color: '#2d2926' }}>two_sum</span><span style={{ color: '#9e9790' }}>(nums, target):</span></div>
                <div className="pl-4"><span style={{ color: '#7c9a6e' }}>seen</span> <span style={{ color: '#b8b2aa' }}>=</span> <span style={{ color: '#d4a574' }}>{'{ }'}</span></div>
                <div className="pl-4"><span style={{ color: '#7c9a6e' }}>for</span> <span style={{ color: '#5c5650' }}>i, num</span> <span style={{ color: '#7c9a6e' }}>in</span> <span style={{ color: '#2d2926' }}>enumerate</span><span style={{ color: '#9e9790' }}>(nums):</span></div>
                <div className="pl-8"><span style={{ color: '#5c5650' }}>comp</span> <span style={{ color: '#b8b2aa' }}>=</span> <span style={{ color: '#5c5650' }}>target - num</span></div>
                <div className="pl-8"><span style={{ color: '#7c9a6e' }}>if</span> <span style={{ color: '#5c5650' }}>comp</span> <span style={{ color: '#7c9a6e' }}>in</span> <span style={{ color: '#5c5650' }}>seen:</span></div>
                <div className="pl-12"><span style={{ color: '#7c9a6e' }}>return</span> <span style={{ color: '#5c5650' }}>[seen[comp], i]</span></div>
                <div className="pl-8"><span style={{ color: '#5c5650' }}>seen[num]</span> <span style={{ color: '#b8b2aa' }}>=</span> <span style={{ color: '#5c5650' }}>i</span></div>
                <div className="mt-4 pt-4" style={{ borderTop: '1px solid #e0dbd2' }}>
                  <div className="flex items-center gap-2 text-xs mb-2" style={{ color: '#7c9a6e' }}>
                    <CheckCircle2 size={13} />
                    <span>Execution: 23ms · Memory: 14.2MB</span>
                  </div>
                  <div className="text-xs" style={{ color: '#9e9790' }}>
                    <span style={{ color: '#7c9a6e', fontWeight: 600 }}>AI:</span> Perfect O(n) solution! Time complexity is O(n) and space is O(n) for the hash map.{' '}
                    <span className="highlight-marker" style={{ color: '#2d2926' }}>Score: 96/100</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="section-divider mx-auto max-w-4xl" />

      {/* ── Testimonials ─────────────────────────────────────── */}
      <section className="py-24 px-6 relative">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={softSpring}
            className="mb-14"
          >
            <span style={{ fontFamily: 'var(--font-hand)', fontSize: '1.2rem', color: '#d4a574' }}>
              real stories, real offers 💛
            </span>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mt-2"
              style={{ fontFamily: 'var(--font-heading)', color: '#2d2926' }}>
              Loved by{' '}
              <span className="hand-underline" style={{ color: '#5a7e4c' }}>Engineers</span>
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ ...gentleSpring, delay: i * 0.12 }}
                whileHover={{ y: -3, rotate: i === 1 ? 0.5 : -0.5 }}
                className="paper-card rounded-2xl p-6"
                style={{
                  marginTop: i === 1 ? '16px' : '0',
                  transform: `rotate(${i === 0 ? -0.5 : i === 2 ? 0.3 : 0}deg)`,
                }}
              >
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} size={13} style={{ color: '#d4a574', fill: '#d4a574' }} />
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-6" style={{ color: '#5c5650' }}>&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm text-white"
                    style={{ background: '#7c9a6e' }}>
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: '#2d2926' }}>{t.name}</div>
                    <div className="text-xs" style={{ color: '#9e9790' }}>{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider mx-auto max-w-4xl" />

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={softSpring}
            className="paper-card rounded-3xl p-14 relative overflow-hidden text-center"
            style={{ transform: 'rotate(0.3deg)' }}
          >
            <div className="blob w-[250px] h-[250px] top-0 left-0" style={{ background: '#c4d8b8', opacity: 0.1 }} />
            <div className="blob w-[250px] h-[250px] bottom-0 right-0" style={{ background: '#e8d0b0', opacity: 0.1, animationDelay: '5s' }} />
            <div className="relative z-10">
              <div className="text-5xl mb-5">📖</div>
              <span style={{ fontFamily: 'var(--font-hand)', fontSize: '1.3rem', color: '#d4a574' }}>
                your study buddy is ready!
              </span>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 mt-3"
                style={{ fontFamily: 'var(--font-heading)', color: '#2d2926' }}>
                Ready to Land Your{' '}
                <span className="hand-underline" style={{ color: '#5a7e4c' }}>Dream Job?</span>
              </h2>
              <p className="mb-10 max-w-lg mx-auto" style={{ color: '#9e9790' }}>
                Join thousands of engineers who used NextUp.ai to prepare for and land offers at top tech companies.
              </p>
              <Link href="/register"
                className="btn-tactile inline-flex items-center gap-3 px-10 py-4 rounded-2xl font-bold text-lg text-white"
                style={{ background: '#7c9a6e', boxShadow: '0 4px 20px rgba(124,154,110,0.2)' }}>
                <BookOpen size={18} />
                Start Free — No Credit Card
                <ChevronRight size={16} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="py-10 px-6" style={{ borderTop: '1px solid #e0dbd2' }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: '#7c9a6e' }}>
              <Brain size={12} className="text-white" />
            </div>
            <span className="font-bold text-sm" style={{ fontFamily: 'var(--font-heading)', color: '#2d2926' }}>
              NextUp<span style={{ color: '#7c9a6e' }}>.</span>ai
            </span>
          </div>
          <p className="text-xs" style={{ color: '#b8b2aa' }}>
            © 2026 NextUp.ai. Built to help engineers get hired.
          </p>
          <div className="flex items-center gap-5 text-xs" style={{ color: '#b8b2aa' }}>
            <Link href="#" className="hover:text-[#7c9a6e] transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-[#7c9a6e] transition-colors">Terms</Link>
            <Link href="https://github.com" className="hover:text-[#7c9a6e] transition-colors flex items-center gap-1">
              <Globe size={12} /> GitHub
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
