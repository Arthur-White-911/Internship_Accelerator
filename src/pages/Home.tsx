import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  BarChart3,
  GraduationCap,
  MessageSquare,
  Dumbbell,
  Bot,
  Briefcase,
  Star,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Zap,
  TrendingUp,
  Users,
  Award,
  Sparkles,
} from 'lucide-react';

/* ─────────────────────── Animated Counter ─────────────────────── */
function AnimatedCounter({ target, suffix = '', duration = 2 }: { target: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const end = target;
    const increment = end / (duration * 60);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [isInView, target, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ─────────────────────── Particle Canvas ─────────────────────── */
function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[] = [];
    const mouse = { x: -1000, y: -1000 };

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.5 + 0.2,
      });
    }

    const handleMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    canvas.addEventListener('mousemove', handleMouse);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          p.vx += (dx / dist) * 0.02;
          p.vy += (dy / dist) * 0.02;
        }

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        p.vx *= 0.99;
        p.vy *= 0.99;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 212, 255, ${p.alpha})`;
        ctx.fill();
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(99, 102, 241, ${0.1 * (1 - dist / 100)})`;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', handleMouse);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0, opacity: 0.6 }}
    />
  );
}

/* ─────────────────────── Floating Orb ─────────────────────── */
const FloatingOrb = ({ className }: { className?: string }) => (
  <motion.div
    className={`absolute rounded-full blur-[100px] pointer-events-none ${className}`}
    animate={{
      scale: [1, 1.2, 1],
      opacity: [0.3, 0.5, 0.3],
    }}
    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
  />
);

/* ═══════════════════════════ HOME ═══════════════════════════ */
export default function Home() {
  return (
    <div>
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <PricingSection />
      <TestimonialsSection />
      <CTASection />
    </div>
  );
}

/* ─────────────────────── Hero Section ─────────────────────── */
function HeroSection() {
  return (
    <section className="relative min-h-[100dvh] flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 hero-gradient" />
      <div
        className="absolute inset-0 opacity-40"
        style={{ backgroundImage: 'url(/hero-bg-particles.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}
      />
      <ParticleBackground />
      <FloatingOrb className="w-[500px] h-[500px] bg-energy-cyan/20 -top-40 -right-40" />
      <FloatingOrb className="w-[400px] h-[400px] bg-crystal-blue/20 -bottom-20 -left-20" />

      {/* Content */}
      <div className="relative z-10 section-container w-full py-20">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
          {/* Left: Text */}
          <div className="flex-1 max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            >
              <h1 className="font-outfit text-5xl sm:text-6xl lg:text-[72px] font-extrabold text-white leading-[1.1] tracking-tight mb-4">
                实习加速器
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-lg text-text-gray mb-6"
            >
              高校学生实习预训数字平台
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.9 }}
              className="text-base text-text-gray leading-relaxed max-w-[480px] mb-8"
            >
              AI驱动的职业能力分析 · 分级培养方案 · 智能面试辅导
              <br />
              从校园到职场，每一步都有专业加速
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.1 }}
              className="flex flex-wrap gap-4"
            >
              <Link
                to="/assessment"
                className="inline-flex items-center gap-2 px-9 py-4 rounded-xl text-white font-medium energy-gradient shadow-glow hover:shadow-glow-lg hover:scale-105 transition-all duration-300"
              >
                <Zap className="w-5 h-5" />
                立即开始测评
              </Link>
              <Link
                to="/programs"
                className="inline-flex items-center gap-2 px-9 py-4 rounded-xl text-white font-medium border border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.3)] transition-all duration-300"
              >
                了解更多
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.25 }}
              className="mt-6"
            >
              <Link
                to="/training?mode=recorded"
                className="flex items-center gap-4 rounded-2xl border border-[rgba(0,212,255,0.16)] bg-[rgba(0,212,255,0.08)] px-4 py-4 transition-all duration-300 hover:border-[rgba(0,212,255,0.28)] hover:bg-[rgba(0,212,255,0.12)]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[rgba(0,212,255,0.12)]">
                  <Sparkles className="h-5 w-5 text-energy-cyan" />
                </div>
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-energy-cyan">
                    <span className="rounded-full bg-[rgba(0,212,255,0.15)] px-2 py-1 text-[10px] tracking-[0.16em]">新功能上线</span>
                    技能培训
                  </div>
                  <div className="text-sm text-white/90">
                    自主训练 + 录播课程，先看导论课快速上手。
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-[#94A3B8]" />
              </Link>
            </motion.div>
          </div>

          {/* Right: Floating Card */}
          <motion.div
            initial={{ opacity: 0, x: 60, rotate: 12 }}
            animate={{ opacity: 1, x: 0, rotate: 8 }}
            transition={{ duration: 0.8, delay: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="hidden lg:block relative"
          >
            <div className="w-[380px] h-[420px] glass-card rounded-3xl p-6 transform rotate-[8deg] hover:rotate-[4deg] transition-transform duration-500">
              {/* Card Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-text-gray text-xs mb-1">能力评估报告</p>
                  <p className="text-white font-outfit font-bold text-lg">综合能力指数</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-energy-cyan to-crystal-blue flex items-center justify-center">
                  <span className="text-white font-bold text-sm">85</span>
                </div>
              </div>

              {/* Mini Radar Chart Simulation */}
              <div className="relative w-full h-40 mb-6">
                <svg viewBox="0 0 200 160" className="w-full h-full">
                  {/* Grid */}
                  {[1, 2, 3, 4, 5].map((i) => (
                    <polygon
                      key={i}
                      points={getRadarPoints(i * 20)}
                      fill="none"
                      stroke="rgba(0,212,255,0.1)"
                      strokeWidth="1"
                    />
                  ))}
                  {/* Data */}
                  <polygon
                    points={getRadarPoints([85, 72, 90, 68, 78])}
                    fill="rgba(0,212,255,0.15)"
                    stroke="#00D4FF"
                    strokeWidth="2"
                  />
                  {/* Labels */}
                  <text x="100" y="12" textAnchor="middle" fill="#94A3B8" fontSize="10">专业技能</text>
                  <text x="190" y="85" textAnchor="middle" fill="#94A3B8" fontSize="10">沟通力</text>
                  <text x="155" y="155" textAnchor="middle" fill="#94A3B8" fontSize="10">领导力</text>
                  <text x="45" y="155" textAnchor="middle" fill="#94A3B8" fontSize="10">团队协作</text>
                  <text x="10" y="85" textAnchor="middle" fill="#94A3B8" fontSize="10">创新思维</text>
                </svg>
              </div>

              {/* Progress Rings */}
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-text-gray">培训完成度</span>
                    <span className="text-energy-cyan">78%</span>
                  </div>
                  <div className="h-2 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '78%' }}
                      transition={{ duration: 1.5, delay: 1.5 }}
                      className="h-full rounded-full energy-gradient"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-text-gray">面试准备度</span>
                    <span className="text-crystal-blue">65%</span>
                  </div>
                  <div className="h-2 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '65%' }}
                      transition={{ duration: 1.5, delay: 1.8 }}
                      className="h-full rounded-full bg-gradient-to-r from-crystal-blue to-neon-purple"
                    />
                  </div>
                </div>
              </div>

              {/* Mini Bar Chart */}
              <div className="flex items-end justify-between mt-6 h-16 gap-2">
                {[65, 80, 55, 90, 72, 85].map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ duration: 0.5, delay: 2 + i * 0.1 }}
                    className="flex-1 rounded-t-md energy-gradient opacity-80"
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 2, duration: 0.4 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-text-gray text-xs">向下滚动</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <ChevronDown className="w-5 h-5 text-text-gray" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* Helper for radar chart */
function getRadarPoints(values: number | number[]): string {
  const numArr = typeof values === 'number' ? [values, values, values, values, values] : values;
  return numArr.map((v, i) => {
    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    const r = (v / 100) * 70;
    const x = 100 + r * Math.cos(angle);
    const y = 80 + r * Math.sin(angle);
    return `${x},${y}`;
  }).join(' ');
}

/* ─────────────────────── Stats Section ─────────────────────── */
function StatsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const stats = [
    { value: 500, suffix: '+', label: '累计服务学生', icon: Users },
    { value: 92, suffix: '%', label: '实习通过率', icon: TrendingUp },
    { value: 10, suffix: '+', label: '合作企业', icon: Briefcase },
    { value: 2000, suffix: '+', label: '面试模拟次数', icon: Award },
  ];

  return (
    <section className="relative bg-light-bg py-24 lg:py-32">
      <div ref={ref} className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="text-center mb-14"
        >
          <h2 className="font-outfit text-3xl lg:text-4xl font-bold text-deep-space mb-3">
            用数据说话
          </h2>
          <p className="text-[#64748B] text-lg">
            已有超过 500+ 高校学生通过实习加速器实现职业加速
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
              className="relative bg-white rounded-2xl p-8 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
            >
              {/* Top gradient line */}
              <div className="absolute top-0 left-6 right-6 h-[3px] rounded-full energy-gradient" />

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[rgba(0,212,255,0.1)] flex items-center justify-center group-hover:bg-[rgba(0,212,255,0.2)] transition-colors">
                  <stat.icon className="w-5 h-5 text-energy-cyan" />
                </div>
              </div>

              <p className="font-jetbrains text-4xl lg:text-[56px] font-bold text-deep-space leading-none mb-2">
                <AnimatedCounter target={stat.value} suffix={stat.suffix} />
              </p>
              <p className="text-[#64748B] text-sm">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── Features Section ─────────────────────── */
function FeaturesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });

  const features = [
    {
      icon: BarChart3,
      title: '职业能力分析',
      description: 'AI多维度评估你的专业技能、软实力和行业匹配度，生成个性化能力雷达图',
      path: '/assessment',
    },
    {
      icon: GraduationCap,
      title: '分级培养方案',
      description: '入门/进阶/专家三级培养体系，从职业规划到实战技能全覆盖',
      path: '/programs',
    },
    {
      icon: MessageSquare,
      title: '智能面试辅导',
      description: '覆盖技术/HR/经理三轮面试，AI实时反馈与评分',
      path: '/interview',
    },
    {
      icon: Dumbbell,
      title: '技能培训',
      description: '自主训练与录播课程并行，按需选择更灵活',
      path: '/training?mode=self',
    },
    {
      icon: Bot,
      title: '智能求职咨询',
      description: '7x24小时AI职业导师，解答各专业领域求职问题',
      path: '/chat',
    },
    {
      icon: Briefcase,
      title: '岗位精准推送',
      description: '基于能力画像，智能匹配并推送最适合的实习岗位',
      path: '/profile',
    },
  ];

  return (
    <section ref={ref} className="relative bg-deep-space py-24 lg:py-32 overflow-hidden">
      <FloatingOrb className="w-[400px] h-[400px] bg-energy-cyan/10 top-20 -right-40" />

      <div className="section-container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <h2 className="font-outfit text-3xl lg:text-4xl font-bold text-white mb-3">
            全方位实习加速体系
          </h2>
          <p className="text-text-gray text-lg">
            从能力诊断到岗位对接，覆盖实习准备的每个环节
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 60 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            >
              <Link
                to={feature.path}
                className="block h-full glass-card rounded-2xl p-8 glass-card-hover transition-all duration-300 group"
              >
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={isInView ? { scale: 1 } : {}}
                  transition={{ duration: 0.4, delay: index * 0.1 + 0.2, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] }}
                  className="w-16 h-16 rounded-full bg-[rgba(0,212,255,0.1)] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform"
                >
                  <feature.icon className="w-8 h-8 text-energy-cyan" />
                </motion.div>
                <h3 className="font-inter font-semibold text-xl text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-text-gray text-sm leading-relaxed">
                  {feature.description}
                </p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── Pricing Section ─────────────────────── */
function PricingSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });

  const plans = [
    {
      name: '入门',
      badge: '入门',
      badgeColor: 'bg-success',
      price: '免费',
      period: '',
      features: ['职业方向测评', '基础技能培训（录播）', '简历模板库', '面试题库 + AI模拟 x2次', '社群答疑'],
      cta: '免费开始',
      ctaColor: 'bg-success hover:bg-[#059669]',
      recommended: false,
    },
    {
      name: '进阶',
      badge: '进阶',
      badgeColor: 'bg-warning',
      price: '399',
      period: '/月',
      features: [
        '职业方向测评 + 深度能力分析',
        '专业技能培训（录播 + 直播）',
        '1对1简历精修 x2次',
        'AI模拟面试 x4次 + 详细反馈',
        '导师线上1对1指导 x4次',
        '行业报告 + 优先岗位推送',
      ],
      cta: '选择进阶',
      ctaColor: 'energy-gradient',
      recommended: true,
    },
    {
      name: '专家',
      badge: '专家',
      badgeColor: 'bg-error',
      price: '1999',
      period: '/月起',
      features: [
        '1对1导师陪跑 x4次',
        '1对1简历精修 x4次',
        'AI + 真人模拟面试 x4次',
        '企业内推资源 + 专属岗位推送',
        '项目实战 + 行业报告',
        '实习保障协议（未获offer全额退款）',
      ],
      cta: '选择专家',
      ctaColor: 'bg-error hover:bg-[#DC2626]',
      recommended: false,
    },
  ];

  return (
    <section ref={ref} className="relative bg-light-bg py-24 lg:py-32">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <h2 className="font-outfit text-3xl lg:text-4xl font-bold text-deep-space mb-3">
            选择你的加速等级
          </h2>
          <p className="text-[#64748B] text-lg">
            三级培养体系，匹配不同阶段的职业需求
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 80 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
              className={`relative bg-white rounded-3xl shadow-md hover:shadow-xl hover:-translate-y-2 transition-all duration-400 p-8 ${
                plan.recommended ? 'md:scale-105 md:-translate-y-1' : ''
              }`}
            >
              {/* Recommended Badge */}
              {plan.recommended && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full energy-gradient text-white text-xs font-semibold whitespace-nowrap">
                  最受欢迎
                </div>
              )}

              {/* Badge */}
              <span className={`inline-block px-3 py-1 rounded-full text-white text-xs font-semibold mb-4 ${plan.badgeColor}`}>
                {plan.badge}
              </span>

              {/* Price */}
              <div className="mb-6">
                <span className="font-outfit text-4xl font-bold text-deep-space">
                  {plan.price === '免费' ? '免费' : <>&yen;{plan.price}</>}
                </span>
                <span className="text-[#64748B] text-sm ml-1">{plan.period}</span>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm text-[#334155]">
                    <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      plan.name === '入门'
                        ? 'bg-success'
                        : plan.name === '进阶'
                        ? 'bg-energy-cyan'
                        : 'bg-error'
                    }`} />
                    {feature}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                to="/programs"
                className={`block text-center py-3.5 rounded-xl text-white font-medium transition-all duration-200 hover:shadow-lg ${plan.ctaColor}`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── Testimonials Section ─────────────────────── */
function TestimonialsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });
  const [currentIndex, setCurrentIndex] = useState(0);

  const testimonials = [
    {
      avatar: '/student-avatar-1.jpg',
      name: '张雨萌',
      school: '北京大学 · 计算机科学与技术',
      content: '通过职业能力分析，我发现自己在算法方面还有很大提升空间。按照培养方案训练两个月后，成功拿到了字节跳动的实习offer！',
      rating: 5,
    },
    {
      avatar: '/student-avatar-2.jpg',
      name: '李明轩',
      school: '清华大学 · 软件工程',
      content: '模拟面试功能太实用了！AI面试官的问题非常贴近实际，每次练习后都有详细的改进建议。面试当天完全不紧张。',
      rating: 5,
    },
    {
      avatar: '/student-avatar-3.jpg',
      name: '王思琪',
      school: '浙江大学 · 信息与通信工程',
      content: '从完全不知道怎么写简历，到导师帮我精修出一份让HR眼前一亮的简历，整个过程只花了两周。现在已经在腾讯实习三个月了！',
      rating: 5,
    },
  ];

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);

  return (
    <section ref={ref} className="relative bg-deep-space py-24 lg:py-32 overflow-hidden">
      <FloatingOrb className="w-[300px] h-[300px] bg-crystal-blue/15 bottom-10 -left-20" />

      <div className="section-container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <h2 className="font-outfit text-3xl lg:text-4xl font-bold text-white mb-3">
            他们的加速故事
          </h2>
          <p className="text-text-gray text-lg">
            听听已经通过平台实现职业突破的学长学姐怎么说
          </p>
        </motion.div>

        {/* Cards */}
        <div className="relative max-w-5xl mx-auto">
          <div className="overflow-hidden">
            <motion.div
              className="flex"
              animate={{ x: `-${currentIndex * 100}%` }}
              transition={{ duration: 0.5, ease: [0.45, 0.05, 0.55, 0.95] as [number, number, number, number] }}
            >
              {testimonials.map((t, i) => (
                <div
                  key={i}
                  className="w-full flex-shrink-0 px-3"
                >
                  <motion.div
                    initial={{ opacity: 0, x: 60 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.7, delay: i * 0.15 }}
                    className="glass-card rounded-3xl p-8 lg:p-10"
                  >
                    {/* Quote Mark */}
                    <motion.span
                      initial={{ scale: 1.5 }}
                      animate={isInView ? { scale: 1 } : {}}
                      transition={{ duration: 0.4, delay: i * 0.15 + 0.3, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] }}
                      className="text-6xl text-energy-cyan/30 font-serif leading-none block mb-4"
                    >
                      &ldquo;
                    </motion.span>

                    {/* Content */}
                    <p className="text-white/90 text-base leading-relaxed mb-6">
                      {t.content}
                    </p>

                    {/* Stars */}
                    <div className="flex gap-1 mb-6">
                      {Array.from({ length: t.rating }).map((_, si) => (
                        <Star key={si} className="w-5 h-5 text-energy-cyan fill-energy-cyan" />
                      ))}
                    </div>

                    {/* Author */}
                    <div className="flex items-center gap-4">
                      <img
                        src={t.avatar}
                        alt={t.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-white font-medium">{t.name}</p>
                        <p className="text-text-gray text-sm">{t.school}</p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={prevSlide}
              className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-text-gray hover:text-white hover:border-energy-cyan/30 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    i === currentIndex ? 'bg-energy-cyan w-8' : 'bg-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.4)]'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={nextSlide}
              className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-text-gray hover:text-white hover:border-energy-cyan/30 transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── CTA Section ─────────────────────── */
function CTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section ref={ref} className="relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 energy-gradient animate-gradient-shift bg-[length:200%_200%]" />
      <div className="absolute inset-0 bg-gradient-to-r from-deep-space/10 to-deep-space/10" />

      <div className="relative z-10 section-container py-24 lg:py-32">
        <div className="text-center max-w-2xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="font-outfit text-3xl lg:text-5xl font-bold text-white mb-4"
          >
            准备好加速你的职业生涯了吗？
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-white/85 mb-10"
          >
            立即注册，免费获取你的职业能力分析报告
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.4, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] }}
          >
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 px-12 py-5 rounded-xl bg-white text-deep-space font-semibold text-lg hover:scale-105 hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)] transition-all duration-300"
            >
              <Zap className="w-5 h-5" />
              免费开始测评
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
