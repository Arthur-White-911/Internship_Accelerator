import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Play,
  Code2,
  Users,
  Briefcase,
  CheckCircle,
  Star,
  Clock,
  Award,
  BarChart3,
  Target,
  RotateCcw,
  MessageSquare,
  Zap,
  TrendingUp,
  Mic,
  Send,
  Loader2,
} from 'lucide-react';
import { useToast } from '../components/Toast';
import { interviewApi } from '../api/interview';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

/* ─── Types ─── */
interface InterviewQuestion {
  id: number;
  question: string;
  category: string;
  frequency: '必问' | '高频' | '常见';
  answer: string;
  starBreakdown?: { situation: string; task: string; action: string; result: string };
  tips?: string[];
  type?: string;
  tags?: string[];
}

interface MockQ {
  id: number;
  question: string;
  type: string;
}

interface MockFeedback {
  sessionId: string;
  score: number;
  strengths: string[];
  improvements: string[];
  breakdown: { content: number; expression: number; logic: number };
}

/* ─── Static Mock Questions ─── */
const mockQuestions: Record<string, MockQ[]> = {
  '技术面试': [
    { id: 1, question: '请解释一下React的虚拟DOM工作原理及其优势', type: '前端基础' },
    { id: 2, question: '如何实现一个Promise.all？请手写代码并解释', type: 'JavaScript' },
    { id: 3, question: '描述一下从输入URL到页面渲染的完整过程', type: '浏览器原理' },
    { id: 4, question: '如何优化一个首屏加载时间过长的网页？', type: '性能优化' },
    { id: 5, question: '请设计一个电商网站的商品详情页前端架构', type: '系统设计' },
  ],
  'HR面试': [
    { id: 1, question: '请做一个1分钟的自我介绍', type: '自我介绍' },
    { id: 2, question: '你对我们公司有什么了解？为什么选择我们？', type: '求职动机' },
    { id: 3, question: '描述一次你与团队成员产生分歧的经历，你是如何处理的？', type: '团队协作' },
    { id: 4, question: '你未来3-5年的职业规划是什么？', type: '职业规划' },
    { id: 5, question: '如果工作中遇到压力或挫折，你会如何应对？', type: '抗压能力' },
  ],
  '经理面试': [
    { id: 1, question: '请介绍一个你最有成就感的项目，你在其中扮演什么角色？', type: '项目经验' },
    { id: 2, question: '如果项目deadline提前一周，团队成员有人请假，你会怎么做？', type: '管理情景' },
    { id: 3, question: '你认为一个好的技术团队应该具备哪些特质？', type: '团队管理' },
    { id: 4, question: '你对行业发展趋势有什么看法？', type: '行业认知' },
    { id: 5, question: '如果你来带领一个3人小组完成一个新项目，你会怎么安排？', type: '领导力' },
  ],
};

const interviewTypes = ['技术面试', 'HR面试', '经理面试'];
const industries = ['IT互联网', '金融', '市场营销', '教育'];

/* ─── API Data Mapper ─── */
function mapApiQuestion(apiData: any): InterviewQuestion {
  const frequencyMap: Record<string, '必问' | '高频' | '常见'> = {
    '必问': '必问',
    '高频': '高频',
    '常见': '常见',
  };

  // Derive starBreakdown from tags if available
  let starBreakdown: InterviewQuestion['starBreakdown'] = undefined;
  let tips: string[] | undefined = undefined;

  if (apiData.tags && Array.isArray(apiData.tags)) {
    // If tags contain structured STAR data, try to parse
    const starTags = apiData.tags.filter((t: string) => t.includes(':'));
    if (starTags.length >= 4) {
      const starObj: Record<string, string> = {};
      starTags.forEach((t: string) => {
        const [key, val] = t.split(':');
        if (key && val) starObj[key.trim()] = val.trim();
      });
      if (starObj['S'] || starObj['情境']) {
        starBreakdown = {
          situation: starObj['S'] || starObj['情境'] || '',
          task: starObj['T'] || starObj['任务'] || '',
          action: starObj['A'] || starObj['行动'] || '',
          result: starObj['R'] || starObj['结果'] || '',
        };
      }
    }
    // Non-structured tags become tips
    const tipTags = apiData.tags.filter((t: string) => !t.includes(':'));
    if (tipTags.length > 0) {
      tips = tipTags;
    }
  }

  return {
    id: apiData.id,
    question: apiData.question,
    category: apiData.category || '其他',
    frequency: frequencyMap[apiData.frequency] || '常见',
    answer: apiData.answer || '',
    starBreakdown,
    tips,
    type: apiData.type,
    tags: apiData.tags,
  };
}

/* ─── Frequency badge helper ─── */
function FrequencyBadge({ freq }: { freq: InterviewQuestion['frequency'] }) {
  const styles = {
    '必问': 'bg-[#EF4444] text-white',
    '高频': 'bg-[#F59E0B] text-white',
    '常见': 'bg-[rgba(0,212,255,0.15)] text-[#00D4FF]',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[freq]}`}>
      {freq}
    </span>
  );
}

/* ─── Animated counter ─── */
function AnimatedScore({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let frame: number;
    const duration = 1000;
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setValue(Math.round(progress * target));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [target]);
  return <span>{value}{suffix}</span>;
}

/* ─── Progress Ring ─── */
function ProgressRing({ progress, size = 120, strokeWidth = 8 }: { progress: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.1)" strokeWidth={strokeWidth} fill="none" />
      <motion.circle
        cx={size / 2} cy={size / 2} r={radius}
        stroke="#00D4FF"
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" className="fill-white font-outfit font-bold text-xl rotate-90">
        {progress}%
      </text>
    </svg>
  );
}

/* ─── Component ─── */
export default function Interview() {
  const [activeCategory, setActiveCategory] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [mockStarted, setMockStarted] = useState(false);
  const [mockType, setMockType] = useState('技术面试');
  const [mockIndustry, setMockIndustry] = useState('IT互联网');
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [mockCompleted, setMockCompleted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState<MockFeedback | null>(null);
  const [mockLoading, setMockLoading] = useState(false);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [allQuestions, setAllQuestions] = useState<InterviewQuestion[]>([]);
  const [categories, setCategories] = useState<string[]>(['全部']);
  const feedbackRef = useRef<HTMLDivElement>(null);

  const toast = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  /* ── Fetch questions on mount ── */
  const fetchQuestions = useCallback(async () => {
    try {
      setQuestionsLoading(true);
      const params: any = {};
      if (activeCategory !== '全部') params.category = activeCategory;
      if (searchQuery) params.search = searchQuery;

      const res = await interviewApi.questions(params);
      if (res.success && Array.isArray(res.data)) {
        const mapped = res.data.map(mapApiQuestion);
        setAllQuestions(mapped);

        // Extract unique categories
        const cats = ['全部', ...Array.from(new Set(mapped.map((q: InterviewQuestion) => q.category)))] as string[];
        setCategories(cats);
      } else {
        toast('获取面试问题失败', 'error');
      }
    } catch (err: any) {
      toast(err?.message || '获取面试问题失败，请稍后重试', 'error');
    } finally {
      setQuestionsLoading(false);
    }
  }, [activeCategory, searchQuery, toast]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const filteredQuestions = allQuestions;

  const currentMockQuestions = mockQuestions[mockType] || [];
  const currentQuestion = currentMockQuestions[currentQIndex];

  const handleNext = () => {
    if (currentQIndex < currentMockQuestions.length - 1) {
      setCurrentQIndex((prev) => prev + 1);
    } else {
      setMockCompleted(true);
    }
  };

  const handlePrev = () => {
    if (currentQIndex > 0) setCurrentQIndex((prev) => prev - 1);
  };

  const handleStartMock = () => {
    if (!user) {
      toast('请先登录后再开始模拟面试', 'error');
      navigate('/login');
      return;
    }
    setMockStarted(true);
    setMockCompleted(false);
    setShowFeedback(false);
    setCurrentQIndex(0);
    setAnswers({});
    setFeedback(null);
  };

  const handleResetMock = () => {
    setMockStarted(false);
    setMockCompleted(false);
    setShowFeedback(false);
    setCurrentQIndex(0);
    setAnswers({});
    setFeedback(null);
  };

  /* ── Submit mock and fetch real feedback ── */
  const handleSubmitMock = async () => {
    try {
      setMockLoading(true);
      const res = await interviewApi.mock({
        interviewType: mockType,
        industry: mockIndustry,
        answers: Object.entries(answers).map(([questionId, answer]) => ({ questionId: Number(questionId), answer })),
      });
      if (res.success && res.data) {
        setFeedback(res.data);
        setMockCompleted(true);
        setShowFeedback(true);
      } else {
        toast('获取反馈失败', 'error');
      }
    } catch (err: any) {
      toast(err?.message || '提交模拟面试失败，请稍后重试', 'error');
    } finally {
      setMockLoading(false);
    }
  };

  const overallScore = feedback?.score ?? 0;

  useEffect(() => {
    if (showFeedback && feedbackRef.current) {
      feedbackRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [showFeedback]);

  return (
    <div className="min-h-[100dvh]">
      {/* ═══════════════ Hero Section ═══════════════ */}
      <section className="relative pt-[72px] overflow-hidden" style={{ background: 'linear-gradient(135deg, #0A1628 0%, #1E3A5F 50%, #0A1628 100%)' }}>
        <div className="section-container py-16 lg:py-24">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Left: Text */}
            <div className="flex-1">
              <motion.h1
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                className="font-outfit text-4xl lg:text-5xl font-bold text-white mb-4"
              >
                面试帮手
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                className="text-[#94A3B8] text-lg leading-relaxed mb-8"
              >
                覆盖全流程面试辅导 · AI实时评分 · 真人导师反馈
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                className="flex flex-wrap gap-6"
              >
                {[
                  { value: '500+', label: '面试真题', color: '#00D4FF' },
                  { value: '3', label: '轮面试覆盖', color: '#00D4FF' },
                  { value: '92%', label: '通过率提升', color: '#00D4FF' },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
                    className="flex items-baseline gap-2"
                  >
                    <span className="font-mono font-bold text-xl" style={{ color: stat.color }}>{stat.value}</span>
                    <span className="text-sm text-[#94A3B8]">{stat.label}</span>
                  </motion.div>
                ))}
              </motion.div>
            </div>
            {/* Right: Image */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
              className="flex-shrink-0"
            >
              <img
                src="/interview-mockup.png"
                alt="面试模拟"
                className="w-[400px] lg:w-[500px] rounded-3xl border border-[rgba(0,212,255,0.15)]"
                style={{ transform: 'rotate(2deg)' }}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════ Main Content ═══════════════ */}
      <section className="py-16 lg:py-24" style={{ backgroundColor: '#0A1628' }}>
        <div className="section-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* ── LEFT: Common Questions ── */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="flex items-center gap-3 mb-6"
              >
                <div className="w-10 h-10 rounded-xl bg-[rgba(0,212,255,0.1)] flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-[#00D4FF]" />
                </div>
                <h2 className="font-outfit text-2xl font-bold text-white">常见问题</h2>
              </motion.div>

              {/* Search */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="relative mb-4"
              >
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                <input
                  type="text"
                  placeholder="搜索面试问题..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchQuestions()}
                  className="w-full bg-[rgba(30,58,95,0.4)] border border-[rgba(0,212,255,0.1)] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#64748B] focus:outline-none focus:border-[rgba(0,212,255,0.3)] transition-colors"
                />
              </motion.div>

              {/* Category tabs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="flex flex-wrap gap-2 mb-6"
              >
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                      activeCategory === cat
                        ? 'bg-[#0A1628] text-white border border-[rgba(0,212,255,0.3)]'
                        : 'bg-[rgba(30,58,95,0.3)] text-[#94A3B8] border border-transparent hover:border-[rgba(0,212,255,0.15)]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </motion.div>

              {/* Loading state */}
              {questionsLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-[#00D4FF] animate-spin mb-3" />
                  <p className="text-[#64748B] text-sm">加载面试问题...</p>
                </div>
              ) : (
                /* Questions accordion */
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {filteredQuestions.map((q, idx) => (
                      <motion.div
                        key={q.id}
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: idx * 0.06 }}
                        layout
                        className="glass-card rounded-2xl overflow-hidden"
                      >
                        <button
                          onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                          className="w-full flex items-center justify-between p-5 text-left"
                        >
                          <div className="flex items-center gap-3">
                            <FrequencyBadge freq={q.frequency} />
                            <span className="text-white font-semibold text-sm">{q.question}</span>
                          </div>
                          <motion.div
                            animate={{ rotate: expandedId === q.id ? 180 : 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <ChevronDown className="w-4 h-4 text-[#94A3B8]" />
                          </motion.div>
                        </button>

                        <AnimatePresence>
                          {expandedId === q.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden"
                            >
                              <div className="px-5 pb-5 border-t border-[rgba(0,212,255,0.06)] pt-4">
                                {/* Answer */}
                                <div className="mb-4">
                                  <h4 className="text-[#00D4FF] text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1">
                                    <Star className="w-3 h-3" />
                                    参考答案
                                  </h4>
                                  <p className="text-[#CBD5E1] text-sm leading-relaxed">{q.answer}</p>
                                </div>

                                {/* STAR Breakdown */}
                                {q.starBreakdown && (
                                  <div className="mb-4 bg-[rgba(10,22,40,0.5)] rounded-xl p-4">
                                    <h4 className="text-[#00D4FF] text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1">
                                      <Target className="w-3 h-3" />
                                      STAR 法则拆解
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      {[
                                        { key: 'situation', label: 'S - 情境', color: '#6366F1' },
                                        { key: 'task', label: 'T - 任务', color: '#8B5CF6' },
                                        { key: 'action', label: 'A - 行动', color: '#00D4FF' },
                                        { key: 'result', label: 'R - 结果', color: '#10B981' },
                                      ].map((item) => (
                                        <div key={item.key} className="flex gap-2">
                                          <div className="w-1 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                                          <div>
                                            <span className="text-xs font-semibold" style={{ color: item.color }}>{item.label}</span>
                                            <p className="text-[#94A3B8] text-xs mt-0.5">
                                              {q.starBreakdown?.[item.key as keyof typeof q.starBreakdown]}
                                            </p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Tips */}
                                {q.tips && q.tips.length > 0 && (
                                  <div>
                                    <h4 className="text-[#F59E0B] text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1">
                                      <Zap className="w-3 h-3" />
                                      回答技巧
                                    </h4>
                                    <ul className="space-y-1">
                                      {q.tips.map((tip, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-[#94A3B8]">
                                          <CheckCircle className="w-3.5 h-3.5 text-[#10B981] mt-0.5 flex-shrink-0" />
                                          {tip}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {filteredQuestions.length === 0 && !questionsLoading && (
                    <div className="text-center py-12">
                      <MessageSquare className="w-10 h-10 text-[#64748B] mx-auto mb-3 opacity-30" />
                      <p className="text-[#64748B] text-sm">没有找到匹配的面试问题</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── RIGHT: Mock Interview ── */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="flex items-center gap-3 mb-6"
              >
                <div className="w-10 h-10 rounded-xl bg-[rgba(0,212,255,0.1)] flex items-center justify-center">
                  <Mic className="w-5 h-5 text-[#00D4FF]" />
                </div>
                <h2 className="font-outfit text-2xl font-bold text-white">模拟面试</h2>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="glass-card rounded-2xl p-6"
              >
                {!mockStarted ? (
                  /* Mock Setup Panel */
                  <div>
                    <p className="text-[#94A3B8] text-sm mb-6">选择面试类型和行业，开始模拟真实面试场景</p>

                    {/* Interview Type */}
                    <div className="mb-5">
                      <label className="text-white text-sm font-semibold mb-3 block">面试类型</label>
                      <div className="grid grid-cols-3 gap-3">
                        {interviewTypes.map((type) => {
                          const icons = { '技术面试': Code2, 'HR面试': Users, '经理面试': Briefcase };
                          const colors = { '技术面试': '#00D4FF', 'HR面试': '#F59E0B', '经理面试': '#EF4444' };
                          const Icon = icons[type as keyof typeof icons];
                          const color = colors[type as keyof typeof colors];
                          const isActive = mockType === type;
                          return (
                            <button
                              key={type}
                              onClick={() => setMockType(type)}
                              className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 ${
                                isActive
                                  ? 'border-[rgba(0,212,255,0.3)] bg-[rgba(0,212,255,0.08)]'
                                  : 'border-[rgba(255,255,255,0.06)] bg-[rgba(30,58,95,0.2)] hover:border-[rgba(255,255,255,0.12)]'
                              }`}
                            >
                              <Icon className="w-6 h-6" style={{ color }} />
                              <span className="text-white text-xs font-medium">{type}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Industry */}
                    <div className="mb-6">
                      <label className="text-white text-sm font-semibold mb-3 block">目标行业</label>
                      <div className="grid grid-cols-4 gap-2">
                        {industries.map((ind) => (
                          <button
                            key={ind}
                            onClick={() => setMockIndustry(ind)}
                            className={`px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                              mockIndustry === ind
                                ? 'bg-[#0A1628] text-white border border-[rgba(0,212,255,0.3)]'
                                : 'bg-[rgba(30,58,95,0.3)] text-[#94A3B8] border border-transparent hover:border-[rgba(0,212,255,0.15)]'
                            }`}
                          >
                            {ind}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Info cards */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      <div className="bg-[rgba(10,22,40,0.5)] rounded-xl p-3 text-center">
                        <Clock className="w-4 h-4 text-[#00D4FF] mx-auto mb-1" />
                        <div className="text-white text-sm font-semibold">{mockType === '技术面试' ? '30-45' : mockType === 'HR面试' ? '20-30' : '30-40'}分钟</div>
                        <div className="text-[#64748B] text-xs">预计时长</div>
                      </div>
                      <div className="bg-[rgba(10,22,40,0.5)] rounded-xl p-3 text-center">
                        <Award className="w-4 h-4 text-[#F59E0B] mx-auto mb-1" />
                        <div className="text-white text-sm font-semibold">{currentMockQuestions.length}道题</div>
                        <div className="text-[#64748B] text-xs">题目数量</div>
                      </div>
                      <div className="bg-[rgba(10,22,40,0.5)] rounded-xl p-3 text-center">
                        <BarChart3 className="w-4 h-4 text-[#10B981] mx-auto mb-1" />
                        <div className="text-white text-sm font-semibold">AI评分</div>
                        <div className="text-[#64748B] text-xs">实时反馈</div>
                      </div>
                    </div>

                    <button
                      onClick={handleStartMock}
                      className="w-full energy-gradient text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:shadow-glow transition-all duration-300"
                    >
                      <Play className="w-4 h-4" />
                      开始模拟面试
                    </button>
                  </div>
                ) : (
                  /* Mock Interview Interface */
                  <div>
                    {!mockCompleted ? (
                      <div>
                        {/* Progress bar */}
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[#94A3B8] text-xs">进度</span>
                            <span className="text-[#00D4FF] text-xs font-semibold">{currentQIndex + 1} / {currentMockQuestions.length}</span>
                          </div>
                          <div className="h-2 bg-[rgba(30,58,95,0.5)] rounded-full overflow-hidden">
                            <motion.div
                              className="h-full energy-gradient rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${((currentQIndex + 1) / currentMockQuestions.length) * 100}%` }}
                              transition={{ duration: 0.4 }}
                            />
                          </div>
                        </div>

                        {/* Question */}
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={currentQuestion.id}
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -30 }}
                            transition={{ duration: 0.3 }}
                            className="mb-6"
                          >
                            <div className="flex items-center gap-2 mb-3">
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[rgba(0,212,255,0.15)] text-[#00D4FF]">
                                {currentQuestion.type}
                              </span>
                              <span className="text-[#64748B] text-xs">{mockType} · {mockIndustry}</span>
                            </div>
                            <h3 className="text-white text-lg font-semibold leading-relaxed">
                              {currentQuestion.question}
                            </h3>
                          </motion.div>
                        </AnimatePresence>

                        {/* Answer input */}
                        <div className="mb-6">
                          <textarea
                            value={answers[currentQuestion.id] || ''}
                            onChange={(e) => setAnswers((prev) => ({ ...prev, [currentQuestion.id]: e.target.value }))}
                            placeholder="请输入你的回答..."
                            rows={6}
                            className="w-full bg-[rgba(10,22,40,0.6)] border border-[rgba(0,212,255,0.1)] rounded-xl p-4 text-sm text-white placeholder-[#64748B] focus:outline-none focus:border-[rgba(0,212,255,0.3)] transition-colors resize-none"
                          />
                        </div>

                        {/* Navigation */}
                        <div className="flex items-center gap-3">
                          <button
                            onClick={handlePrev}
                            disabled={currentQIndex === 0}
                            className="px-4 py-3 rounded-xl border border-[rgba(255,255,255,0.1)] text-[#94A3B8] text-sm font-medium flex items-center gap-1.5 hover:border-[rgba(255,255,255,0.2)] hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ChevronLeft className="w-4 h-4" />
                            上一题
                          </button>
                          {currentQIndex < currentMockQuestions.length - 1 ? (
                            <button
                              onClick={handleNext}
                              className="flex-1 energy-gradient text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:shadow-glow transition-all duration-300"
                            >
                              下一题
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={handleSubmitMock}
                              disabled={mockLoading}
                              className="flex-1 energy-gradient text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:shadow-glow transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {mockLoading ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  提交中...
                                </>
                              ) : (
                                <>
                                  <Send className="w-4 h-4" />
                                  提交
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.5, type: 'spring' }}
                          className="w-20 h-20 rounded-full bg-[rgba(16,185,129,0.15)] flex items-center justify-center mx-auto mb-4"
                        >
                          <CheckCircle className="w-10 h-10 text-[#10B981]" />
                        </motion.div>
                        <h3 className="text-white text-xl font-bold mb-2">模拟面试完成</h3>
                        <p className="text-[#94A3B8] text-sm mb-6">点击下方按钮查看AI评分反馈</p>
                        <button
                          onClick={() => setShowFeedback(true)}
                          className="energy-gradient text-white font-semibold px-8 py-3 rounded-xl hover:shadow-glow transition-all duration-300"
                        >
                          查看反馈报告
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>

              {/* ── Feedback Panel ── */}
              <AnimatePresence>
                {showFeedback && mockCompleted && feedback && (
                  <motion.div
                    ref={feedbackRef}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 40 }}
                    transition={{ duration: 0.5 }}
                    className="glass-card rounded-2xl p-6 mt-6"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-white text-lg font-bold flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-[#00D4FF]" />
                        AI 面试反馈
                      </h3>
                      <button
                        onClick={handleResetMock}
                        className="text-[#94A3B8] text-xs flex items-center gap-1 hover:text-white transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        重新开始
                      </button>
                    </div>

                    {/* Overall Score */}
                    <div className="flex items-center gap-6 mb-6">
                      <ProgressRing progress={overallScore} size={100} strokeWidth={6} />
                      <div>
                        <div className="text-white text-2xl font-bold font-outfit">
                          <AnimatedScore target={overallScore} />
                          <span className="text-lg text-[#94A3B8]">/100</span>
                        </div>
                        <p className="text-[#10B981] text-sm font-medium mt-1">
                          {overallScore >= 90 ? '表现优秀' : overallScore >= 75 ? '综合表现良好' : overallScore >= 60 ? '表现尚可，仍有提升空间' : '需要加强练习'}
                        </p>
                        <p className="text-[#64748B] text-xs mt-1">{mockType} · {mockIndustry}</p>
                      </div>
                    </div>

                    {/* Category Scores */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      {[
                        { label: '回答完整性', score: feedback.breakdown?.content ?? 88, color: '#00D4FF' },
                        { label: '逻辑清晰度', score: feedback.breakdown?.logic ?? 82, color: '#6366F1' },
                        { label: '表达流畅度', score: feedback.breakdown?.expression ?? 85, color: '#10B981' },
                      ].map((cat) => (
                        <div key={cat.label} className="bg-[rgba(10,22,40,0.5)] rounded-xl p-3">
                          <div className="text-[#64748B] text-xs mb-2">{cat.label}</div>
                          <div className="text-white font-bold text-lg font-outfit">{cat.score}</div>
                          <div className="h-1.5 bg-[rgba(30,58,95,0.5)] rounded-full mt-2 overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ backgroundColor: cat.color }}
                              initial={{ width: 0 }}
                              animate={{ width: `${cat.score}%` }}
                              transition={{ duration: 0.8, delay: 0.3 }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Strengths */}
                    {feedback.strengths && feedback.strengths.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-[#10B981] text-sm font-semibold mb-3 flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          优势亮点
                        </h4>
                        <ul className="space-y-2">
                          {feedback.strengths.map((s, i) => (
                            <motion.li
                              key={i}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.5 + i * 0.1 }}
                              className="flex items-start gap-2 text-sm text-[#CBD5E1]"
                            >
                              <CheckCircle className="w-4 h-4 text-[#10B981] mt-0.5 flex-shrink-0" />
                              {s}
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Improvements */}
                    {feedback.improvements && feedback.improvements.length > 0 && (
                      <div>
                        <h4 className="text-[#F59E0B] text-sm font-semibold mb-3 flex items-center gap-1">
                          <Target className="w-4 h-4" />
                          改进建议
                        </h4>
                        <ul className="space-y-2">
                          {feedback.improvements.map((s, i) => (
                            <motion.li
                              key={i}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.8 + i * 0.1 }}
                              className="flex items-start gap-2 text-sm text-[#CBD5E1]"
                            >
                              <Star className="w-4 h-4 text-[#F59E0B] mt-0.5 flex-shrink-0" />
                              {s}
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
