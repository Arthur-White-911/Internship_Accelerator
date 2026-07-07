import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  BarChart3,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Code2,
  Briefcase,
  Target,
  Check,
  History,
  TrendingUp,
  Award,
  Zap,
  Lightbulb,
  GraduationCap,
  Layers,
  MessageSquare,
  Users,
  Brain,
  Loader2,
  LogIn,
} from 'lucide-react';
import { useToast } from '../components/Toast';
import { assessmentApi } from '../api/assessment';
import { useAuth } from '../hooks/useAuth';

/* ─── Types ─── */
interface FormData {
  major: string;
  skillLevel: string;
  experience: string;
  careerGoal: string;
}

interface ApiScores {
  professional: number;
  practical: number;
  communication: number;
  teamwork: number;
  innovation: number;
}

interface ApiAssessmentResult {
  id: number;
  matchPercent: number;
  scores: ApiScores;
  suggestions: string[];
  createdAt: string;
}

interface ApiHistoryItem {
  id: number;
  major: string;
  skillLevel: string;
  careerGoal: string;
  matchPercent: number;
  scores: ApiScores;
  suggestions: string[];
  createdAt: string;
}

interface AnalysisResult {
  matchPercent: number;
  capabilities: { name: string; score: number; icon: React.ReactNode }[];
  suggestions: string[];
  history: { date: string; title: string; score: number }[];
}

/* ─── Animation Variants ─── */
const easeOutExpo = [0.16, 1, 0.3, 1] as [number, number, number, number];

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: easeOutExpo },
  },
};

/* ─── Animated Counter ─── */
function AnimatedCounter({ target, duration = 1500 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, target, duration]);

  return <span ref={ref}>{count}</span>;
}

/* ─── Animated Progress Bar ─── */
function AnimatedProgressBar({
  percent,
  delay = 0,
  color = 'bg-gradient-to-r from-[#00D4FF] to-[#6366F1]',
}: {
  percent: number;
  delay?: number;
  color?: string;
}) {
  return (
    <div className="w-full h-2.5 bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percent}%` }}
        transition={{ duration: 0.8, delay, ease: easeOutExpo }}
        className={`h-full rounded-full ${color}`}
      />
    </div>
  );
}

/* ─── Step Indicator ─── */
function StepIndicator({
  steps,
  currentStep,
  completedSteps,
}: {
  steps: string[];
  currentStep: number;
  completedSteps: number[];
}) {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4 mb-10">
      {steps.map((label, index) => {
        const isCompleted = completedSteps.includes(index);
        const isCurrent = index === currentStep;
        const stepNum = index + 1;

        return (
          <div key={label} className="flex items-center gap-2 sm:gap-4">
            <div className="flex flex-col items-center gap-2">
              <motion.div
                animate={
                  isCurrent
                    ? { scale: [1, 1.1, 1] }
                    : isCompleted
                      ? { scale: 1 }
                      : {}
                }
                transition={
                  isCurrent
                    ? { repeat: Infinity, duration: 2, ease: 'easeInOut' }
                    : {}
                }
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  isCompleted
                    ? 'bg-success text-white'
                    : isCurrent
                      ? 'bg-energy-cyan text-deep-space shadow-glow'
                      : 'bg-[rgba(255,255,255,0.06)] text-text-gray border border-[rgba(255,255,255,0.12)]'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  stepNum
                )}
              </motion.div>
              <span
                className={`text-xs font-medium whitespace-nowrap hidden sm:block ${
                  isCurrent
                    ? 'text-energy-cyan'
                    : isCompleted
                      ? 'text-success'
                      : 'text-text-gray'
                }`}
              >
                {label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className="w-8 sm:w-16 h-[2px] relative mb-6 sm:mb-6">
                <div
                  className={`absolute inset-0 ${
                    isCompleted ? 'bg-success' : 'bg-[rgba(255,255,255,0.1)]'
                  }`}
                />
                {isCompleted && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.4, ease: easeOutExpo }}
                    className="absolute inset-0 bg-success origin-left"
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Hero Section ─── */
function HeroSection() {
  return (
    <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden hero-gradient">
      {/* Subtle particle-like dots background */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-energy-cyan/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 0.6, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      <div className="section-container relative z-10 text-center py-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: easeOutExpo }}
        >
          <h1 className="font-outfit text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
            职业能力分析
          </h1>
        </motion.div>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.3, ease: easeOutExpo }}
          className="w-16 h-[2px] energy-gradient mx-auto mb-6 origin-center"
        />

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4, ease: easeOutExpo }}
          className="text-text-gray text-base sm:text-lg max-w-xl mx-auto mb-10"
        >
          AI智能诊断 · 多维能力画像 · 个性化提升路径
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.5, ease: easeOutExpo }}
          className="relative max-w-md mx-auto"
        >
          <img
            src="/assessment-illustration.jpg"
            alt="能力分析配图"
            className="w-full h-auto rounded-2xl opacity-80"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          {/* Fallback visual if image doesn't load */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-48 h-48 rounded-full border-2 border-energy-cyan/20 flex items-center justify-center">
              <div className="w-36 h-36 rounded-full border-2 border-energy-cyan/30 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full border-2 border-energy-cyan/40 flex items-center justify-center">
                  <BarChart3 className="w-12 h-12 text-energy-cyan/60" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Form Section ─── */
function FormSection({
  onSubmit,
  isSubmitting,
}: {
  onSubmit: (data: FormData) => void;
  isSubmitting: boolean;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [direction, setDirection] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    major: '',
    skillLevel: '',
    experience: '',
    careerGoal: '',
  });

  const steps = ['基本信息', '专业技能', '实习经历', '职业目标'];

  const updateField = useCallback(
    (field: keyof FormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setDirection(1);
      setCompletedSteps((prev) =>
        prev.includes(currentStep) ? prev : [...prev, currentStep]
      );
      setCurrentStep((prev) => prev + 1);
    } else {
      setCompletedSteps((prev) =>
        prev.includes(currentStep) ? prev : [...prev, currentStep]
      );
      onSubmit(formData);
    }
  }, [currentStep, steps.length, onSubmit, formData]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const canProceed = [
    formData.major !== '',
    formData.skillLevel !== '',
    true, // experience is optional
    formData.careerGoal !== '',
  ][currentStep];

  const stepVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 60 : -60,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -60 : 60,
      opacity: 0,
    }),
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                专业选择
              </label>
              <div className="relative">
                <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-gray" />
                <select
                  value={formData.major}
                  onChange={(e) => updateField('major', e.target.value)}
                  className="w-full h-12 pl-12 pr-4 bg-white/5 border border-[rgba(255,255,255,0.12)] rounded-xl text-white text-sm focus:outline-none focus:border-energy-cyan focus:shadow-[0_0_0_3px_rgba(0,212,255,0.15)] transition-all duration-200 appearance-none"
                >
                  <option value="" disabled className="bg-deep-space">
                    请选择你的专业
                  </option>
                  <option value="计算机科学与技术" className="bg-deep-space">
                    计算机科学与技术
                  </option>
                  <option value="金融学" className="bg-deep-space">
                    金融学
                  </option>
                  <option value="市场营销" className="bg-deep-space">
                    市场营销
                  </option>
                  <option value="教育学" className="bg-deep-space">
                    教育学
                  </option>
                  <option value="其他" className="bg-deep-space">
                    其他
                  </option>
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-gray rotate-90 pointer-events-none" />
              </div>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                技能水平
              </label>
              <div className="relative">
                <Layers className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-gray" />
                <select
                  value={formData.skillLevel}
                  onChange={(e) => updateField('skillLevel', e.target.value)}
                  className="w-full h-12 pl-12 pr-4 bg-white/5 border border-[rgba(255,255,255,0.12)] rounded-xl text-white text-sm focus:outline-none focus:border-energy-cyan focus:shadow-[0_0_0_3px_rgba(0,212,255,0.15)] transition-all duration-200 appearance-none"
                >
                  <option value="" disabled className="bg-deep-space">
                    请选择你的技能水平
                  </option>
                  <option value="初级" className="bg-deep-space">
                    初级 - 刚入门，需要系统学习
                  </option>
                  <option value="中级" className="bg-deep-space">
                    中级 - 有一定经验，希望提升
                  </option>
                  <option value="高级" className="bg-deep-space">
                    高级 - 经验丰富，追求精进
                  </option>
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-gray rotate-90 pointer-events-none" />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                实习经历
              </label>
              <div className="relative">
                <Briefcase className="absolute left-4 top-4 w-5 h-5 text-text-gray" />
                <textarea
                  value={formData.experience}
                  onChange={(e) => updateField('experience', e.target.value)}
                  placeholder="请描述你的实习或项目经历（选填）"
                  rows={5}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.12)] rounded-xl text-white text-sm placeholder:text-text-gray focus:outline-none focus:border-energy-cyan focus:shadow-[0_0_0_3px_rgba(0,212,255,0.15)] transition-all duration-200 resize-none"
                />
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                职业目标
              </label>
              <div className="relative">
                <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-gray" />
                <select
                  value={formData.careerGoal}
                  onChange={(e) => updateField('careerGoal', e.target.value)}
                  className="w-full h-12 pl-12 pr-4 bg-white/5 border border-[rgba(255,255,255,0.12)] rounded-xl text-white text-sm focus:outline-none focus:border-energy-cyan focus:shadow-[0_0_0_3px_rgba(0,212,255,0.15)] transition-all duration-200 appearance-none"
                >
                  <option value="" disabled className="bg-deep-space">
                    请选择你的职业目标
                  </option>
                  <option value="技术岗" className="bg-deep-space">
                    技术岗 - 开发/算法/架构
                  </option>
                  <option value="管理岗" className="bg-deep-space">
                    管理岗 - 产品/运营/项目管理
                  </option>
                  <option value="市场岗" className="bg-deep-space">
                    市场岗 - 营销/品牌/商务
                  </option>
                  <option value="财务岗" className="bg-deep-space">
                    财务岗 - 金融/投资/财务分析
                  </option>
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-gray rotate-90 pointer-events-none" />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <section className="py-16 sm:py-24 bg-light-bg">
      <div className="section-container max-w-[960px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: easeOutExpo }}
          className="text-center mb-12"
        >
          <h2 className="font-outfit text-2xl sm:text-3xl font-bold text-deep-space mb-3">
            开始你的能力测评
          </h2>
          <p className="text-dark-gray text-sm sm:text-base">
            填写以下信息，AI将为你生成个性化能力分析报告
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2, ease: easeOutExpo }}
        >
          <StepIndicator
            steps={steps}
            currentStep={currentStep}
            completedSteps={completedSteps}
          />
        </motion.div>

        <div className="glass-card rounded-2xl p-6 sm:p-10">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: easeOutExpo }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-[rgba(255,255,255,0.08)]">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0 || isSubmitting}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                currentStep === 0
                  ? 'text-text-gray/40 cursor-not-allowed'
                  : 'text-white border border-[rgba(255,255,255,0.12)] hover:bg-white/5'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              上一步
            </button>

            <div className="flex items-center gap-2">
              <span className="text-text-gray text-xs">
                步骤 {currentStep + 1} / {steps.length}
              </span>
            </div>

            <motion.button
              whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
              whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
              onClick={handleNext}
              disabled={!canProceed || isSubmitting}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                canProceed && !isSubmitting
                  ? 'energy-gradient text-white shadow-glow hover:shadow-glow-cyan'
                  : 'bg-[rgba(255,255,255,0.06)] text-text-gray/40 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  分析中...
                </>
              ) : currentStep === steps.length - 1 ? (
                <>
                  提交分析
                  <Sparkles className="w-4 h-4" />
                </>
              ) : (
                <>
                  下一步
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── AI Analysis Result Panel ─── */
function AnalysisResultPanel({
  result,
  history,
  fullHistory,
  onDownloadReport,
  onStartTraining,
  onConsultMentor,
}: {
  result: AnalysisResult;
  history: { date: string; title: string; score: number }[];
  fullHistory: ApiHistoryItem[];
  onDownloadReport: () => void;
  onStartTraining: () => void;
  onConsultMentor: () => void;
}) {
  const [showResult, setShowResult] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ApiHistoryItem | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowResult(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section id="analysis-result" className="py-16 sm:py-24 bg-deep-space">
      <div className="section-container max-w-[1280px]">
        <AnimatePresence>
          {showResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: easeOutExpo }}
                className="text-center mb-12"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[rgba(0,212,255,0.1)] border border-energy-cyan/20 mb-6">
                  <Sparkles className="w-4 h-4 text-energy-cyan" />
                  <span className="text-energy-cyan text-sm font-medium">
                    AI 分析报告已生成
                  </span>
                </div>
                <h2 className="font-outfit text-2xl sm:text-4xl font-bold text-white mb-3">
                  你的职业能力分析报告
                </h2>
                <p className="text-text-gray text-sm sm:text-base">
                  基于AI深度分析，为你生成多维能力画像
                </p>
              </motion.div>

              {/* Main Score */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2, ease: easeOutExpo }}
                className="flex flex-col items-center mb-12"
              >
                <div className="relative w-40 h-40 mb-4">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                    <circle
                      cx="60"
                      cy="60"
                      r="52"
                      fill="none"
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth="8"
                    />
                    <motion.circle
                      cx="60"
                      cy="60"
                      r="52"
                      fill="none"
                      stroke="url(#scoreGradient)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 52}`}
                      initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                      animate={{
                        strokeDashoffset:
                          2 *
                          Math.PI *
                          52 *
                          (1 - result.matchPercent / 100),
                      }}
                      transition={{ duration: 1.5, delay: 0.5, ease: easeOutExpo }}
                    />
                    <defs>
                      <linearGradient
                        id="scoreGradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="0%"
                      >
                        <stop offset="0%" stopColor="#00D4FF" />
                        <stop offset="100%" stopColor="#6366F1" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-jetbrains text-4xl sm:text-5xl font-bold bg-gradient-to-r from-[#00D4FF] to-[#6366F1] bg-clip-text text-transparent">
                      <AnimatedCounter target={result.matchPercent} />
                      <span className="text-2xl">%</span>
                    </span>
                  </div>
                </div>
                <span className="text-text-gray text-sm">职业匹配度</span>
              </motion.div>

              {/* Capability Progress Bars */}
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12"
              >
                {result.capabilities.map((cap, index) => (
                  <motion.div
                    key={cap.name}
                    variants={staggerItem}
                    whileHover={{
                      scale: 1.02,
                      boxShadow: '0 0 40px rgba(0,212,255,0.2)',
                    }}
                    className="glass-card glass-card-hover rounded-2xl p-6 transition-all duration-300"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-[rgba(0,212,255,0.1)] flex items-center justify-center text-energy-cyan">
                        {cap.icon}
                      </div>
                      <div>
                        <h4 className="text-white text-sm font-semibold">
                          {cap.name}
                        </h4>
                      </div>
                      <div className="ml-auto">
                        <span className="font-jetbrains text-xl font-bold text-energy-cyan">
                          <AnimatedCounter target={cap.score} />
                        </span>
                      </div>
                    </div>
                    <AnimatedProgressBar percent={cap.score} delay={0.5 + index * 0.1} />
                  </motion.div>
                ))}
              </motion.div>

              {/* AI Suggestions */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8, ease: easeOutExpo }}
                className="glass-card rounded-2xl p-6 sm:p-8 mb-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-energy-cyan to-crystal-blue flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-outfit text-lg font-semibold text-white">
                    AI 提升建议
                  </h3>
                </div>
                <div className="space-y-4">
                  {result.suggestions.map((suggestion, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: 0.4,
                        delay: 1 + index * 0.1,
                        ease: easeOutExpo,
                      }}
                      className="flex items-start gap-3"
                    >
                      <div className="w-6 h-6 rounded-full bg-[rgba(0,212,255,0.1)] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Zap className="w-3 h-3 text-energy-cyan" />
                      </div>
                      <p className="text-text-gray text-sm leading-relaxed">
                        {suggestion}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Analysis History */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.0, ease: easeOutExpo }}
                className="glass-card rounded-2xl p-6 sm:p-8 mb-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[rgba(16,185,129,0.1)] flex items-center justify-center">
                    <History className="w-5 h-5 text-success" />
                  </div>
                  <h3 className="font-outfit text-lg font-semibold text-white">
                    测评历史
                  </h3>
                </div>
                <div className="space-y-3">
                  {history.length === 0 && (
                    <p className="text-text-gray text-sm text-center py-6">
                      暂无历史测评记录
                    </p>
                  )}
                  {history.map((entry, index) => (
                    <motion.div
                      key={entry.date + index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: 0.4,
                        delay: 1.2 + index * 0.1,
                        ease: easeOutExpo,
                      }}
                      className="flex items-center justify-between p-4 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(0,212,255,0.15)] transition-all duration-200"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-[rgba(0,212,255,0.08)] flex items-center justify-center">
                          <TrendingUp className="w-5 h-5 text-energy-cyan" />
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">
                            {entry.title}
                          </p>
                          <p className="text-text-gray text-xs">{entry.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-energy-cyan" />
                          <span className="font-jetbrains text-lg font-bold text-energy-cyan">
                            {entry.score}
                          </span>
                        </div>
                        {fullHistory[index] && (
                          <button
                            onClick={() => { setSelectedReport(fullHistory[index]); setShowReportModal(true); }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[rgba(0,212,255,0.1)] text-[#00D4FF] border border-[rgba(0,212,255,0.2)] hover:bg-[rgba(0,212,255,0.2)] transition-all duration-200"
                          >
                            查看报告
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.4, ease: easeOutExpo }}
                className="flex flex-wrap items-center justify-center gap-4"
              >
                <button
                  onClick={onDownloadReport}
                  className="px-6 py-3 rounded-xl border border-[rgba(255,255,255,0.12)] text-white text-sm font-medium hover:bg-white/5 transition-all duration-200 flex items-center gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  下载报告
                </button>
                <button
                  onClick={onStartTraining}
                  className="px-6 py-3 rounded-xl energy-gradient text-white text-sm font-medium shadow-glow hover:shadow-glow-cyan transition-all duration-200 flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  开始训练
                </button>
                <button
                  onClick={onConsultMentor}
                  className="px-6 py-3 rounded-xl border border-[rgba(255,255,255,0.12)] text-white text-sm font-medium hover:bg-white/5 transition-all duration-200 flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  咨询导师
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══════════════ Report Detail Modal ═══════════════ */}
      <AnimatePresence>
        {showReportModal && selectedReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowReportModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, ease: easeOutExpo }}
              className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl p-6"
              style={{ backgroundColor: '#0D1F3C', border: '1px solid rgba(0,212,255,0.15)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-white text-lg font-bold flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-energy-cyan" />
                    能力测评报告详情
                  </h3>
                  <p className="text-text-gray text-xs mt-1">
                    {selectedReport.major} - {selectedReport.careerGoal} ·{' '}
                    {selectedReport.createdAt
                      ? new Date(selectedReport.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
                      : ''}
                  </p>
                </div>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="w-8 h-8 rounded-lg bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-text-gray hover:text-white hover:bg-[rgba(255,255,255,0.1)] transition-all"
                >
                  ×
                </button>
              </div>

              {/* Overall Score */}
              <div className="flex items-center gap-6 mb-6 p-4 rounded-xl bg-[rgba(10,22,40,0.6)]">
                <div className="relative w-24 h-24 flex-shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                    <circle
                      cx="40" cy="40" r="34" fill="none"
                      stroke="#00D4FF" strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 34}`}
                      strokeDashoffset={`${2 * Math.PI * 34 * (1 - (selectedReport.matchPercent ?? 0) / 100)}`}
                      style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-bold text-xl font-outfit">{selectedReport.matchPercent ?? 0}</span>
                  </div>
                </div>
                <div>
                  <div className="text-white text-2xl font-bold font-outfit">
                    {selectedReport.matchPercent ?? 0}
                    <span className="text-base text-text-gray">/100</span>
                  </div>
                  <p className="text-sm font-medium mt-1" style={{
                    color: (selectedReport.matchPercent ?? 0) >= 85 ? '#10B981'
                      : (selectedReport.matchPercent ?? 0) >= 70 ? '#00D4FF'
                      : (selectedReport.matchPercent ?? 0) >= 55 ? '#F59E0B' : '#EF4444'
                  }}>
                    {(selectedReport.matchPercent ?? 0) >= 85 ? '超强匹配度'
                      : (selectedReport.matchPercent ?? 0) >= 70 ? '良好匹配度'
                      : (selectedReport.matchPercent ?? 0) >= 55 ? '中等匹配度' : '待提升'}
                  </p>
                  <p className="text-text-gray text-xs mt-1">{selectedReport.skillLevel} · {selectedReport.major}</p>
                </div>
              </div>

              {/* Capability Scores */}
              {selectedReport.scores && (
                <div className="mb-6">
                  <h4 className="text-energy-cyan text-sm font-semibold mb-4 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    多维能力评分
                  </h4>
                  <div className="space-y-3">
                    {[
                      { label: '专业知识', score: selectedReport.scores.professional ?? 0, color: '#00D4FF' },
                      { label: '实践能力', score: selectedReport.scores.practical ?? 0, color: '#6366F1' },
                      { label: '沟通能力', score: selectedReport.scores.communication ?? 0, color: '#10B981' },
                      { label: '团队协作', score: selectedReport.scores.teamwork ?? 0, color: '#F59E0B' },
                      { label: '创新能力', score: selectedReport.scores.innovation ?? 0, color: '#EF4444' },
                    ].map((cap) => (
                      <div key={cap.label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-text-gray text-xs">{cap.label}</span>
                          <span className="font-mono text-sm font-bold" style={{ color: cap.color }}>{cap.score}</span>
                        </div>
                        <div className="h-1.5 bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${cap.score}%`, backgroundColor: cap.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {selectedReport.suggestions && selectedReport.suggestions.length > 0 && (
                <div className="mb-5">
                  <h4 className="text-[#F59E0B] text-sm font-semibold mb-3 flex items-center gap-1">
                    <Lightbulb className="w-4 h-4" />
                    成长建议
                  </h4>
                  <ul className="space-y-2">
                    {selectedReport.suggestions.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#CBD5E1]">
                        <Check className="w-4 h-4 text-[#F59E0B] mt-0.5 flex-shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Close Button */}
              <button
                onClick={() => setShowReportModal(false)}
                className="w-full mt-2 py-3 rounded-xl border border-[rgba(255,255,255,0.1)] text-text-gray text-sm font-medium hover:border-[rgba(0,212,255,0.3)] hover:text-white transition-all duration-200"
              >
                关闭
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/* ─── Login Prompt Section ─── */
function LoginPromptSection() {
  const navigate = useNavigate();

  return (
    <section className="py-16 sm:py-24 bg-light-bg">
      <div className="section-container max-w-[960px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: easeOutExpo }}
          className="glass-card rounded-2xl p-10 sm:p-16 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-[rgba(0,212,255,0.1)] flex items-center justify-center mx-auto mb-6">
            <LogIn className="w-8 h-8 text-energy-cyan" />
          </div>
          <h2 className="font-outfit text-2xl sm:text-3xl font-bold text-deep-space mb-3">
            请先登录
          </h2>
          <p className="text-dark-gray text-sm sm:text-base max-w-md mx-auto mb-8">
            登录后即可使用AI能力测评功能，获取个性化职业能力分析报告
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/login')}
            className="energy-gradient text-white px-8 py-3 rounded-xl text-sm font-medium shadow-glow hover:shadow-glow-cyan transition-all duration-200 flex items-center gap-2 mx-auto"
          >
            <LogIn className="w-4 h-4" />
            前往登录
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Loading History Section ─── */
function LoadingHistorySection() {
  return (
    <section className="py-16 sm:py-24 bg-deep-space">
      <div className="section-container max-w-[1280px] flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-energy-cyan animate-spin" />
          <p className="text-text-gray text-sm">加载历史记录中...</p>
        </div>
      </div>
    </section>
  );
}

/* ─── Main Page ─── */
export default function Assessment() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const [submittedData, setSubmittedData] = useState<FormData | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ApiAssessmentResult | null>(null);
  const [history, setHistory] = useState<ApiHistoryItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Fetch assessment history on mount (only when logged in)
  useEffect(() => {
    if (!user) return;

    const fetchHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const res = await assessmentApi.history();
        if (res.success && Array.isArray(res.data)) {
          setHistory(res.data);
        } else {
          setHistory([]);
        }
      } catch (err: any) {
        toast(err?.message || '获取历史记录失败', 'error');
        setHistory([]);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [user, toast]);

  const handleSubmit = useCallback(
    async (data: FormData) => {
      if (!user) {
        toast('请先登录', 'error');
        return;
      }

      setIsSubmitting(true);
      try {
        const res = await assessmentApi.submit({
          major: data.major,
          skillLevel: data.skillLevel,
          experience: data.experience,
          careerGoal: data.careerGoal,
        });

        if (res.success && res.data) {
          setSubmittedData(data);
          setAnalysisResult(res.data);
          toast('分析完成！', 'success');

          // Refresh history after successful submission
          try {
            const historyRes = await assessmentApi.history();
            if (historyRes.success && Array.isArray(historyRes.data)) {
              setHistory(historyRes.data);
            }
          } catch {
            // Silently fail history refresh
          }

          // Scroll to result after a short delay
          setTimeout(() => {
            const resultEl = document.getElementById('analysis-result');
            if (resultEl) {
              resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 100);
        } else {
          toast('分析提交失败，请重试', 'error');
        }
      } catch (err: any) {
        toast(err?.message || '分析提交失败，请重试', 'error');
      } finally {
        setIsSubmitting(false);
      }
    },
    [user, toast]
  );

  const handleDownloadReport = useCallback(() => {
    toast('报告已生成，开始下载...', 'info');
  }, [toast]);

  const handleStartTraining = useCallback(() => {
    navigate('/training');
  }, [navigate]);

  const handleConsultMentor = useCallback(() => {
    navigate('/chat');
  }, [navigate]);

  // Transform API result to display format
  const displayResult: AnalysisResult | null = analysisResult
    ? {
        matchPercent: analysisResult.matchPercent,
        capabilities: [
          {
            name: '专业知识',
            score: analysisResult.scores.professional,
            icon: <Brain className="w-5 h-5" />,
          },
          {
            name: '实践能力',
            score: analysisResult.scores.practical,
            icon: <Code2 className="w-5 h-5" />,
          },
          {
            name: '沟通能力',
            score: analysisResult.scores.communication,
            icon: <MessageSquare className="w-5 h-5" />,
          },
          {
            name: '团队协作',
            score: analysisResult.scores.teamwork,
            icon: <Users className="w-5 h-5" />,
          },
          {
            name: '创新能力',
            score: analysisResult.scores.innovation,
            icon: <Lightbulb className="w-5 h-5" />,
          },
        ],
        suggestions: analysisResult.suggestions,
        history: [], // Will be passed separately
      }
    : null;

  // Transform API history to display format
  const displayHistory = history.map((item) => ({
    date: item.createdAt
      ? new Date(item.createdAt).toLocaleDateString('zh-CN')
      : '',
    title: `${item.major} - ${item.careerGoal}`,
    score: item.matchPercent,
  }));

  return (
    <main className="min-h-[100dvh]">
      <HeroSection />
      {user ? (
        <FormSection onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      ) : (
        <LoginPromptSection />
      )}
      {isLoadingHistory && submittedData && <LoadingHistorySection />}
      {submittedData && displayResult && (
        <AnalysisResultPanel
          result={displayResult}
          history={displayHistory}
          fullHistory={history}
          onDownloadReport={handleDownloadReport}
          onStartTraining={handleStartTraining}
          onConsultMentor={handleConsultMentor}
        />
      )}
    </main>
  );
}
