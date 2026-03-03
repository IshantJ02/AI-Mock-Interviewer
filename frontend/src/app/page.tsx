'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Navbar from '@/components/ui/Navbar';
import CustomCursor from '@/components/ui/CustomCursor';
import {
  Brain, Code2, Mic, BarChart3, Zap, Shield,
  ChevronRight, Star, ArrowRight, Terminal,
  Target, TrendingUp, Users, Sparkles, Play,
  CheckCircle2, Globe, Lock, Cpu
} from 'lucide-react';

const HeroBackground = dynamic(() => import('@/components/three/HeroBackground'), { ssr: false });

const COMPANY_MODES = [
  { name: 'Google', icon: '🔍', color: 'from-blue-500 to-green-500', desc: 'Optimization & edge cases mastery', traits: ['Hard algorithms', 'Big-O proof', 'System Design'] },
  { name: 'Amazon', icon: '📦', color: 'from-orange-500 to-yellow-500', desc: 'Leadership principles + scalability', traits: ['LP questions', 'Scalable design', 'Real-world impact'] },
  { name: 'Meta', icon: '⚡', color: 'from-blue-600 to-purple-600', desc: 'Product thinking at scale', traits: ['Social scale', 'Product intuition', 'Data structures'] },
  { name: 'Startup', icon: '🚀', color: 'from-pink-500 to-rose-500', desc: 'Ship fast, practical trade-offs', traits: ['Pragmatic code', 'Full-stack', 'Product sense'] },
];

const FEATURES = [
  { icon: Brain, title: 'AI-Powered Interviews', desc: 'GPT-4 generates company-specific questions, evaluates your code, and gives real-time feedback like a senior engineer.', color: 'purple' },
  { icon: Mic, title: 'Voice Interview Mode', desc: 'Speak your answers aloud. Our AI listens, transcribes, and evaluates your communication in real-time.', color: 'cyan' },
  { icon: Code2, title: 'Live Code Execution', desc: 'Run C++, Java, and Python in sandboxed Docker containers. 2-second timeout. Zero setup required.', color: 'green' },
  { icon: BarChart3, title: 'Weakness Detection', desc: 'AI tracks your performance across 15 DSA topics and builds a personalized practice roadmap.', color: 'orange' },
  { icon: Target, title: 'Company Mode AI', desc: 'Switch between Google, Amazon, Meta, and Startup modes. The AI\'s personality and focus changes completely.', color: 'pink' },
  { icon: TrendingUp, title: 'Progress Analytics', desc: 'Skill heatmaps, score trends, and topic mastery graphs give you a 360° view of your growth.', color: 'blue' },
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

export default function HomePage() {
  const [activeCompany, setActiveCompany] = useState(0);
  const [typedText, setTypedText] = useState('');
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  // Typewriter effect
  const phrases = ['Google SWE Interview', 'Amazon SDE Round', 'Meta Technical Screen', 'DSA Mastery'];
  useEffect(() => {
    let i = 0, j = 0, deleting = false;
    const type = () => {
      const current = phrases[i % phrases.length];
      if (!deleting) {
        setTypedText(current.slice(0, j + 1));
        j++;
        if (j === current.length) { deleting = true; setTimeout(type, 1500); return; }
      } else {
        setTypedText(current.slice(0, j - 1));
        j--;
        if (j === 0) { deleting = false; i++; }
      }
      setTimeout(type, deleting ? 40 : 80);
    };
    const t = setTimeout(type, 500);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line

  // Auto-rotate company modes
  useEffect(() => {
    const interval = setInterval(() => setActiveCompany(p => (p + 1) % COMPANY_MODES.length), 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-gray-950 overflow-x-hidden">
      <CustomCursor />
      <Navbar />

      {/* ── Hero Section ───────────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="absolute inset-0">
          <HeroBackground />
        </motion.div>

        {/* Gradient blobs */}
        <div className="blob w-96 h-96 bg-purple-600 top-20 left-10" />
        <div className="blob w-80 h-80 bg-cyan-600 bottom-20 right-20" style={{ animationDelay: '3s' }} />
        <div className="blob w-64 h-64 bg-blue-600 top-1/2 left-1/2" style={{ animationDelay: '6s' }} />

        {/* Grid overlay */}
        <div className="absolute inset-0 grid-bg opacity-30" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 pt-24 pb-16 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-sm mb-8"
          >
            <Sparkles size={14} className="text-purple-400" />
            Powered by GPT-4 · Real-time AI Feedback
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-tight"
          >
            <span className="text-white">Ace Your</span>
            <br />
            <span className="gradient-text glow-text-purple">{typedText}</span>
            <span className="typewriter-cursor text-purple-400 animate-pulse">|</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-xl text-gray-400 max-w-2xl mx-auto mb-12"
          >
            AI-powered mock interviews with live code execution, voice mode, and real-time feedback.
            Train like the pros. Land your dream offer.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Link
              href="/register"
              className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-2xl text-white font-semibold text-lg hover:scale-105 transition-all duration-300 glow-purple shadow-2xl"
            >
              <Sparkles size={20} />
              Start Free Interview
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-3 px-8 py-4 glass rounded-2xl text-gray-300 font-semibold text-lg hover:text-white hover:border-purple-500/50 transition-all duration-300"
            >
              <Play size={16} />
              Watch Demo
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
          >
            {STATS.map(({ value, label, icon: Icon }) => (
              <div key={label} className="glass rounded-2xl p-4 text-center hover:border-purple-500/30 transition-all">
                <Icon size={20} className="text-purple-400 mx-auto mb-2" />
                <div className="text-2xl font-black gradient-text">{value}</div>
                <div className="text-xs text-gray-400">{label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-500 text-xs"
        >
          <span>Scroll to explore</span>
          <div className="w-px h-12 bg-gradient-to-b from-purple-500 to-transparent animate-pulse" />
        </motion.div>
      </section>

      {/* ── Company Modes Section ──────────────────────────────────── */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 dot-bg opacity-20" />
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              <span className="text-white">Train for </span>
              <span className="gradient-text">Any Company</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Our AI adapts its personality, difficulty, and focus based on your target company.
            </p>
          </motion.div>

          {/* Horizontal scroll company cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {COMPANY_MODES.map((company, i) => (
              <motion.div
                key={company.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                onClick={() => setActiveCompany(i)}
                className={`mode-card glass rounded-3xl p-6 cursor-pointer ${activeCompany === i ? 'selected' : 'hover:border-white/20'}`}
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${company.color} flex items-center justify-center text-2xl mb-4 shadow-lg`}>
                  {company.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{company.name}</h3>
                <p className="text-gray-400 text-sm mb-4">{company.desc}</p>
                <div className="space-y-1">
                  {company.traits.map(trait => (
                    <div key={trait} className="flex items-center gap-2 text-xs text-gray-500">
                      <CheckCircle2 size={12} className="text-purple-400" />
                      {trait}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Active company preview */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCompany}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-8 glass rounded-3xl p-8 border border-purple-500/20"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{COMPANY_MODES[activeCompany].icon}</span>
                <div>
                  <h4 className="text-lg font-bold text-white">{COMPANY_MODES[activeCompany].name} Mode Active</h4>
                  <p className="text-gray-400 text-sm">AI interviewer personality loaded</p>
                </div>
                <div className="ml-auto flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-green-400 text-xs">Active</span>
                </div>
              </div>
              <div className="bg-black/30 rounded-2xl p-4 font-mono text-sm text-gray-300 border border-white/5">
                <span className="text-purple-400">AI Interviewer:</span>{' '}
                <span className="text-gray-300">
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

      {/* ── Features Grid ──────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              <span className="text-white">Everything You Need to </span>
              <span className="gradient-text">Get Hired</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc, color }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group glass rounded-3xl p-8 hover:border-purple-500/30 transition-all duration-300 hover:-translate-y-2"
              >
                <div className={`w-12 h-12 rounded-2xl mb-6 flex items-center justify-center ${color === 'purple' ? 'bg-purple-500/20 text-purple-400' :
                  color === 'cyan' ? 'bg-cyan-500/20 text-cyan-400' :
                    color === 'green' ? 'bg-green-500/20 text-green-400' :
                      color === 'orange' ? 'bg-orange-500/20 text-orange-400' :
                        color === 'pink' ? 'bg-pink-500/20 text-pink-400' :
                          'bg-blue-500/20 text-blue-400'
                  } group-hover:scale-110 transition-transform`}>
                  <Icon size={22} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DSA Topics Visual ─────────────────────────────────────── */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="blob w-96 h-96 bg-purple-700 top-0 right-0 opacity-20" />
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              <span className="gradient-text">15 DSA Topics</span>
              <span className="text-white"> Covered</span>
            </h2>
            <p className="text-gray-400">From easy arrays to hard graph problems — tracked and optimized.</p>
          </motion.div>
          <div className="flex flex-wrap justify-center gap-3">
            {TOPICS.map((topic, i) => (
              <motion.div
                key={topic}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.1, y: -4 }}
                className="px-5 py-2.5 glass rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:border-purple-500/50 transition-all cursor-default"
              >
                {topic}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Code Execution Demo ────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm mb-6">
                <Terminal size={14} />
                Docker Sandbox · 2s Timeout · No Network
              </div>
              <h2 className="text-4xl font-black text-white mb-4">
                Run Code in <span className="gradient-text">Seconds</span>
              </h2>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Write Python, C++, or Java directly in the browser. Each execution runs in an isolated Docker container — completely secure, no system access, auto-destroyed after execution.
              </p>
              <div className="space-y-3">
                {[
                  { icon: Shield, text: 'Isolated Docker containers' },
                  { icon: Zap, text: '2-second time limit enforced' },
                  { icon: Lock, text: 'No network or filesystem access' },
                  { icon: Cpu, text: '64MB memory limit per run' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3 text-gray-300 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <Icon size={14} className="text-purple-400" />
                    </div>
                    {text}
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass rounded-3xl overflow-hidden border border-purple-500/20"
            >
              {/* Fake terminal header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-black/20">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
                <span className="ml-2 text-xs text-gray-500 font-mono">solution.py</span>
              </div>
              <div className="p-6 font-mono text-sm">
                <div className="text-gray-400 text-xs mb-3"># Two Sum · O(n) solution</div>
                <div><span className="text-purple-400">def</span> <span className="text-blue-400">two_sum</span><span className="text-gray-300">(nums, target):</span></div>
                <div className="pl-4"><span className="text-purple-400">seen</span> <span className="text-gray-400">=</span> <span className="text-orange-400">{'{}'}</span></div>
                <div className="pl-4"><span className="text-cyan-400">for</span> <span className="text-gray-300">i, num</span> <span className="text-cyan-400">in</span> <span className="text-blue-400">enumerate</span><span className="text-gray-300">(nums):</span></div>
                <div className="pl-8"><span className="text-purple-400">comp</span> <span className="text-gray-400">=</span> <span className="text-gray-300">target - num</span></div>
                <div className="pl-8"><span className="text-cyan-400">if</span> <span className="text-gray-300">comp</span> <span className="text-cyan-400">in</span> <span className="text-gray-300">seen:</span></div>
                <div className="pl-12"><span className="text-cyan-400">return</span> <span className="text-gray-300">[seen[comp], i]</span></div>
                <div className="pl-8"><span className="text-gray-300">seen[num]</span> <span className="text-gray-400">=</span> <span className="text-gray-300">i</span></div>
                <div className="mt-4 pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 text-green-400 text-xs mb-2">
                    <CheckCircle2 size={14} />
                    <span>Execution: 23ms · Memory: 14.2MB</span>
                  </div>
                  <div className="text-gray-500 text-xs">
                    <span className="text-purple-400">AI:</span> Perfect O(n) solution! Time complexity is O(n) and space is O(n) for the hash map. <span className="text-cyan-400">Score: 96/100</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────── */}
      <section className="py-24 px-4 relative">
        <div className="absolute inset-0 dot-bg opacity-10" />
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              <span className="text-white">Loved by </span>
              <span className="gradient-text">Engineers</span>
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="glass rounded-3xl p-6 hover:border-purple-500/30 transition-all hover:-translate-y-1"
              >
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} size={14} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-6">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{t.name}</div>
                    <div className="text-xs text-gray-400">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ─────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass rounded-3xl p-12 border border-purple-500/20 relative overflow-hidden"
          >
            <div className="blob w-64 h-64 bg-purple-600 top-0 left-0 opacity-20" />
            <div className="blob w-64 h-64 bg-cyan-600 bottom-0 right-0 opacity-20" style={{ animationDelay: '4s' }} />
            <div className="relative z-10">
              <div className="text-5xl mb-4">🚀</div>
              <h2 className="text-4xl font-black text-white mb-4">
                Ready to Land Your <span className="gradient-text">Dream Job?</span>
              </h2>
              <p className="text-gray-400 mb-8 max-w-lg mx-auto">
                Join thousands of engineers who used NextUp.ai to prepare for and land offers at top tech companies.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-2xl text-white font-bold text-lg hover:scale-105 transition-all glow-purple"
              >
                <Sparkles size={20} />
                Start Free — No Credit Card
                <ChevronRight size={18} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Brain size={14} className="text-white" />
            </div>
            <span className="font-bold gradient-text">NextUp.ai</span>
          </div>
          <p className="text-gray-500 text-sm">
            © 2026 NextUp.ai. Built to help engineers get hired.
          </p>
          <div className="flex items-center gap-4 text-gray-500 text-sm">
            <Link href="#" className="hover:text-purple-400 transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-purple-400 transition-colors">Terms</Link>
            <Link href="https://github.com" className="hover:text-purple-400 transition-colors flex items-center gap-1">
              <Globe size={14} /> GitHub
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
