import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code2,
  Languages,
  UsersRound,
  Clock,
  CheckCircle,
  Play,
  BookOpen,
  Brain,
  Monitor,
  Mic,
  MessageSquare,
  Zap,
  Award,
  TrendingUp,
  ChevronRight,
  Dumbbell,
  Loader2,
  PlayCircle,
  Video,
  Sparkles,
} from 'lucide-react';
import { useToast } from '../components/Toast';
import { trainingApi } from '../api/training';
import { useAuth } from '../hooks/useAuth';
import { useSearchParams } from 'react-router-dom';

/* ─── Types ─── */
interface TrainingProject {
  id: number;
  title: string;
  description: string;
  category: string;
  duration: string;
  difficulty: '初级' | '中级' | '高级';
  content: string;
  image: string;
}

interface TrainingSession {
  id: number;
  topic: string;
  duration: string;
  status: string;
  suggestion: string;
  createdAt: string;
  category: string;
  difficulty: string;
}

interface TrainingProgress {
  category: string;
  percent: number;
}

interface TrainingTab {
  key: string;
  label: string;
  icon: React.ElementType;
  image: string;
  description: string;
  stats: string;
}

interface RecordedCourse {
  key: string;
  title: string;
  description: string;
  videoSrc: string;
  intro: string;
}

type TrainingMode = 'self' | 'recorded';

/* ─── Tab Config ─── */
const trainingTabs: TrainingTab[] = [
  {
    key: 'skill',
    label: '技能训练',
    icon: Code2,
    image: '/training-coding.jpg',
    description: '覆盖前端、后端、算法、工具等核心技术栈，从基础到进阶的系统课程',
    stats: '120+ 课程 · 45+ 实战项目 · 30+ 小时',
  },
  {
    key: 'language',
    label: '语言训练',
    icon: Languages,
    image: '/training-language.jpg',
    description: '提升职场英语能力，从日常口语到商务沟通的全面训练',
    stats: '60+ 课程 · 20+ 模拟场景 · AI发音评测',
  },
  {
    key: 'softskill',
    label: '软技能训练',
    icon: UsersRound,
    image: '/training-softskill.jpg',
    description: '沟通能力、领导力、时间管理 — 职场软实力的系统培养',
    stats: '40+ 课程 · 15+ 互动训练 · 情景模拟',
  },
];

const durationOptions = ['30分钟', '1小时', '2小时', '3小时'];

const defaultIcons: Record<string, React.ElementType> = {
  skill: Monitor,
  language: Mic,
  softskill: MessageSquare,
};

const progressColorMap: Record<string, string> = {
  skill: '#00D4FF',
  language: '#8B5CF6',
  softskill: '#10B981',
};

const progressLabelMap: Record<string, string> = {
  skill: '技能训练',
  language: '语言训练',
  softskill: '软技能训练',
};

const trainingModeOptions: { key: TrainingMode; label: string; description: string; icon: React.ElementType }[] = [
  {
    key: 'self',
    label: '自主训练',
    description: '按需训练，继续使用原有模块',
    icon: PlayCircle,
  },
  {
    key: 'recorded',
    label: '录播课程',
    description: '互联网运营与数据分析导论课',
    icon: Video,
  },
];

const recordedCourses: RecordedCourse[] = [
  {
    key: 'internet-operations',
    title: '互联网运营',
    description: '当前只开放导论课，后续会继续补充完整课程体系。',
    videoSrc: '/training-videos/internet-operations-intro.mp4',
    intro: '从用户、内容、活动和转化四个角度，快速建立互联网运营的基础认知。',
  },
  {
    key: 'data-analysis',
    title: '数据分析',
    description: '当前只开放导论课，后续会继续补充完整课程体系。',
    videoSrc: '/training-videos/data-analysis-intro.mp4',
    intro: '围绕业务问题、指标体系和数据工具，入门理解数据分析的工作方式。',
  },
];

/* ─── Difficulty badge ─── */
function DifficultyBadge({ level }: { level: '初级' | '中级' | '高级' }) {
  const styles = {
    '初级': 'bg-[rgba(16,185,129,0.15)] text-[#10B981]',
    '中级': 'bg-[rgba(245,158,11,0.15)] text-[#F59E0B]',
    '高级': 'bg-[rgba(239,68,68,0.15)] text-[#EF4444]',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${styles[level]}`}>
      {level}
    </span>
  );
}

/* ─── Animated Progress Bar ─── */
function AnimatedProgressBar({ percentage, color, delay = 0, label }: { percentage: number; color: string; delay?: number; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-white text-sm font-medium">{label}</span>
        <span className="text-sm font-bold font-outfit" style={{ color }}>{percentage}%</span>
      </div>
      <div className="h-3 bg-[rgba(30,58,95,0.5)] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: inView ? `${percentage}%` : 0 }}
          transition={{ duration: 1.2, delay, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        />
      </div>
    </div>
  );
}

function TrainingModeSwitcher({ activeMode, onChange }: { activeMode: TrainingMode; onChange: (mode: TrainingMode) => void }) {
  return (
    <div className="mb-8 flex flex-wrap gap-3">
      {trainingModeOptions.map((mode) => {
        const ModeIcon = mode.icon;
        const isActive = activeMode === mode.key;
        return (
          <button
            key={mode.key}
            onClick={() => onChange(mode.key)}
            className={`flex min-w-[220px] items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all duration-300 ${
              isActive
                ? 'border-[rgba(0,212,255,0.35)] bg-[rgba(0,212,255,0.12)] text-white shadow-glow'
                : 'border-[rgba(255,255,255,0.08)] bg-[rgba(30,58,95,0.28)] text-[#94A3B8] hover:border-[rgba(0,212,255,0.18)] hover:text-white'
            }`}
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isActive ? 'bg-[rgba(0,212,255,0.16)]' : 'bg-[rgba(255,255,255,0.05)]'}`}>
              <ModeIcon className={`h-4 w-4 ${isActive ? 'text-energy-cyan' : 'text-[#94A3B8]'}`} />
            </div>
            <div className="flex-1">
              <div className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-[#CBD5E1]'}`}>{mode.label}</div>
              <div className="text-xs text-[#64748B]">{mode.description}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function RecordedCourseCard({ course }: { course: RecordedCourse }) {
  const [videoError, setVideoError] = useState(false);

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="glass-card rounded-2xl p-5 lg:p-6"
    >
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[rgba(0,212,255,0.12)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-energy-cyan">
            导论课
          </div>
          <h3 className="text-xl font-bold text-white">{course.title}</h3>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[rgba(0,212,255,0.1)]">
          <Sparkles className="h-5 w-5 text-energy-cyan" />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[rgba(0,212,255,0.1)] bg-[rgba(10,22,40,0.65)]">
        {!videoError ? (
          <video
            className="aspect-video w-full bg-black"
            controls
            preload="metadata"
            src={course.videoSrc}
            onError={() => setVideoError(true)}
          />
        ) : (
          <div className="flex aspect-video items-center justify-center px-6 text-center">
            <div>
              <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(0,212,255,0.12)]">
                <Video className="h-6 w-6 text-energy-cyan" />
              </div>
              <p className="text-sm font-medium text-white">等待视频文件</p>
              <p className="mt-2 text-xs leading-relaxed text-[#94A3B8]">
                请把视频放到 frontend_src/public{course.videoSrc} 后刷新页面。
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 space-y-2">
        <p className="text-sm text-[#CBD5E1] leading-relaxed">{course.description}</p>
        <p className="text-sm text-energy-cyan leading-relaxed">{course.intro}</p>
      </div>
    </motion.article>
  );
}

function RecordedCoursesView({ onModeChange }: { onModeChange: (mode: TrainingMode) => void }) {
  return (
    <div className="min-h-[100dvh]">
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0A1628 0%, #13263F 48%, #0A1628 100%)' }}>
        <div className="section-container py-16 lg:py-24">
          <div className="flex flex-col gap-10">
            <div className="max-w-3xl">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[rgba(0,212,255,0.1)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-energy-cyan">
                  技能培训 · 录播课程
                </div>
                <h1 className="font-outfit text-4xl lg:text-5xl font-bold text-white mb-4">
                  录播课程
                </h1>
                <p className="text-[#94A3B8] text-lg leading-relaxed max-w-2xl">
                  先开放互联网运营和数据分析两个板块的导论课，直接用浏览器原生播放器观看。
                </p>
              </motion.div>
            </div>

            <TrainingModeSwitcher activeMode="recorded" onChange={onModeChange} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {recordedCourses.map((course) => (
                <RecordedCourseCard key={course.key} course={course} />
              ))}
            </div>

            <div className="glass-card rounded-2xl p-5 text-sm text-[#94A3B8] leading-relaxed">
              后续如果你把测试视频发给我，我可以直接替换这两个视频源，后面再把课程元数据迁到 MySQL 或其他存储。
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ─── Component ─── */
export default function Training() {
  const toast = useToast();
  useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeMode: TrainingMode = searchParams.get('mode') === 'recorded' ? 'recorded' : 'self';

  const [activeTab, setActiveTab] = useState(0);
  const [selectedProject, setSelectedProject] = useState<TrainingProject | null>(null);
  const [topic, setTopic] = useState('');
  const [content, setContent] = useState('');
  const [duration, setDuration] = useState('1小时');
  const [submitted, setSubmitted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  /* API Data States */
  const [projects, setProjects] = useState<TrainingProject[]>([]);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [progressData, setProgressData] = useState<TrainingProgress[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [startingTraining, setStartingTraining] = useState(false);
  const [completingTraining, setCompletingTraining] = useState(false);
  const [startResult, setStartResult] = useState<{ sessionId: number; topic: string; duration: string; suggestions: string[] } | null>(null);

  const currentTab = trainingTabs[activeTab];
  const currentTabKey = currentTab.key;

  /* Filter projects by current tab category */
  const filteredProjects = projects.filter((p) => p.category === currentTabKey);

  /* Fetch projects, sessions, progress on mount */
  useEffect(() => {
    const fetchData = async () => {
      setLoadingProjects(true);
      setLoadingSessions(true);
      setLoadingProgress(true);
      try {
        const [projRes, sessRes, progRes] = await Promise.all([
          trainingApi.projects(),
          trainingApi.sessions(),
          trainingApi.progress(),
        ]);
        if (projRes.success && projRes.data) {
          setProjects(projRes.data);
        }
        if (sessRes.success && sessRes.data) {
          setSessions(sessRes.data);
        }
        if (progRes.success && progRes.data) {
          setProgressData(progRes.data);
        }
      } catch (err: any) {
        toast(err?.message || '获取数据失败，请稍后重试', 'error');
      } finally {
        setLoadingProjects(false);
        setLoadingSessions(false);
        setLoadingProgress(false);
      }
    };
    fetchData();
  }, [toast]);

  const handleSelectProject = (project: TrainingProject) => {
    setSelectedProject(project);
    setTopic(project.title);
    setContent(project.content || project.description);
    setSubmitted(false);
    setCompleted(false);
    setStartResult(null);
  };

  const handleStartTraining = async () => {
    if (!topic.trim()) return;
    setStartingTraining(true);
    setSubmitted(false);
    setCompleted(false);
    try {
      const durationMap: Record<string, string> = {
        '30分钟': '30',
        '1小时': '60',
        '2小时': '120',
        '3小时': '180',
      };
      const res = await trainingApi.start({
        projectId: selectedProject?.id || 0,
        topic,
        content,
        duration: durationMap[duration] || '60',
      });
      if (res.success && res.data) {
        setStartResult(res.data);
        setSubmitted(true);
        toast('训练计划已开始！', 'success');
      } else {
        toast(res.message || '开始训练失败', 'error');
      }
    } catch (err: any) {
      toast(err?.message || '开始训练失败，请稍后重试', 'error');
    } finally {
      setStartingTraining(false);
    }
  };

  const handleComplete = async () => {
    setCompletingTraining(true);
    try {
      /* Refetch progress and sessions after completion */
      const [progRes, sessRes] = await Promise.all([
        trainingApi.progress(),
        trainingApi.sessions(),
      ]);
      if (progRes.success && progRes.data) {
        setProgressData(progRes.data);
      }
      if (sessRes.success && sessRes.data) {
        setSessions(sessRes.data);
      }
      setCompleted(true);
      toast('训练完成！进度已更新', 'success');
    } catch (err: any) {
      toast(err?.message || '更新进度失败', 'error');
    } finally {
      setCompletingTraining(false);
    }
  };

  const handleReset = () => {
    setSelectedProject(null);
    setTopic('');
    setContent('');
    setDuration('1小时');
    setSubmitted(false);
    setCompleted(false);
    setStartResult(null);
  };

  useEffect(() => {
    if (submitted && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [submitted]);

  /* Count projects per tab */
  const getProjectCount = (tabKey: string) => projects.filter((p) => p.category === tabKey).length;

  if (activeMode === 'recorded') {
    return <RecordedCoursesView onModeChange={(mode) => setSearchParams({ mode })} />;
  }

  return (
    <div className="min-h-[100dvh]">
      {/* ═══════════════ Hero Section ═══════════════ */}
      <section
        className="relative pt-[72px] overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0A1628 0%, #1E3A5F 50%, #0A1628 100%)' }}
      >
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
                自主训练中心
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                className="text-[#94A3B8] text-lg leading-relaxed mb-8"
              >
                技能 · 语言 · 软技能 — 按需训练，自主提升
              </motion.p>

              <TrainingModeSwitcher activeMode={activeMode} onChange={(mode) => setSearchParams({ mode })} />

              {/* Quick entry cards */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex flex-wrap gap-4"
              >
                {trainingTabs.map((tab, i) => (
                  <motion.button
                    key={tab.key}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                    onClick={() => { setActiveTab(i); window.scrollTo({ top: 500, behavior: 'smooth' }); }}
                    className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-[rgba(30,58,95,0.4)] border border-[rgba(0,212,255,0.1)] hover:border-[rgba(0,212,255,0.3)] hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <div className="w-9 h-9 rounded-xl bg-[rgba(0,212,255,0.1)] flex items-center justify-center">
                      <tab.icon className="w-4 h-4 text-[#00D4FF]" />
                    </div>
                    <div className="text-left">
                      <div className="text-white text-sm font-semibold">{tab.label}</div>
                      <div className="text-[#64748B] text-xs">
                        {loadingProjects ? '加载中...' : `${getProjectCount(tab.key)} 项训练`}
                      </div>
                    </div>
                  </motion.button>
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
                src="/training-coding.jpg"
                alt="自主训练"
                className="w-[350px] lg:w-[400px] rounded-3xl border border-[rgba(0,212,255,0.15)]"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════ Training Tabs Section ═══════════════ */}
      <section className="py-16 lg:py-24" style={{ backgroundColor: '#0A1628' }}>
        <div className="section-container">
          {/* Tab Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="flex gap-2 mb-8 overflow-x-auto pb-2"
          >
            {trainingTabs.map((tab, i) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(i);
                  setSubmitted(false);
                  setCompleted(false);
                }}
                className={`flex items-center gap-2 px-6 py-4 rounded-t-2xl text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
                  activeTab === i
                    ? 'bg-[#0A1628] text-white border-b-[3px] border-[#00D4FF]'
                    : 'bg-[rgba(30,58,95,0.3)] text-[#94A3B8] border-b-[3px] border-transparent hover:text-white'
                }`}
              >
                <tab.icon className={`w-4 h-4 ${activeTab === i ? 'text-[#00D4FF]' : 'text-[#64748B]'}`} />
                {tab.label}
              </button>
            ))}
          </motion.div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              {/* Module Cover */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="glass-card rounded-2xl p-6 lg:p-8 mb-8 flex flex-col lg:flex-row items-center gap-8"
              >
                <div className="flex-1">
                  <h2 className="font-outfit text-2xl font-bold text-white mb-3">{currentTab.label}</h2>
                  <p className="text-[#94A3B8] text-base leading-relaxed mb-4">{currentTab.description}</p>
                  <div className="flex items-center gap-2 text-[#00D4FF]">
                    <Award className="w-4 h-4" />
                    <span className="text-sm font-medium">{currentTab.stats}</span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <img
                    src={currentTab.image}
                    alt={currentTab.label}
                    className="w-[280px] lg:w-[350px] rounded-2xl border border-[rgba(0,212,255,0.1)]"
                  />
                </div>
              </motion.div>

              {/* Training Cards Grid */}
              {loadingProjects ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 text-[#00D4FF] animate-spin" />
                  <span className="text-[#94A3B8] text-sm ml-3">加载训练项目中...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
                  <AnimatePresence>
                    {filteredProjects.map((project, idx) => {
                      const IconComp = defaultIcons[currentTabKey] || BookOpen;
                      return (
                        <motion.div
                          key={project.id}
                          initial={{ opacity: 0, y: 50 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.6, delay: idx * 0.1 }}
                          className={`glass-card rounded-2xl p-5 transition-all duration-300 ${
                            selectedProject?.id === project.id
                              ? 'border-[rgba(0,212,255,0.4)] shadow-glow'
                              : 'hover:-translate-y-1 hover:shadow-lg'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="w-10 h-10 rounded-xl bg-[rgba(0,212,255,0.1)] flex items-center justify-center">
                              <IconComp className="w-5 h-5 text-[#00D4FF]" />
                            </div>
                            <DifficultyBadge level={project.difficulty} />
                          </div>
                          <h3 className="text-white font-semibold text-base mb-2">{project.title}</h3>
                          <p className="text-[#94A3B8] text-sm leading-relaxed mb-4 line-clamp-2">{project.description}</p>
                          <div className="flex items-center gap-1.5 text-[#64748B] text-xs mb-4">
                            <Clock className="w-3.5 h-3.5" />
                            {project.duration}
                          </div>
                          <button
                            onClick={() => handleSelectProject(project)}
                            className="w-full py-2.5 rounded-xl border border-[rgba(0,212,255,0.2)] text-[#00D4FF] text-sm font-medium flex items-center justify-center gap-1 hover:bg-[rgba(0,212,255,0.1)] hover:border-[rgba(0,212,255,0.4)] transition-all duration-200"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            选择项目
                          </button>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}

              {/* Training Form */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="glass-card rounded-2xl p-6 lg:p-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[rgba(0,212,255,0.1)] flex items-center justify-center">
                    <Dumbbell className="w-5 h-5 text-[#00D4FF]" />
                  </div>
                  <div>
                    <h3 className="text-white text-lg font-bold">训练计划</h3>
                    <p className="text-[#94A3B8] text-xs">选择上方训练项目或自定义填写</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Topic */}
                  <div>
                    <label className="text-white text-sm font-semibold mb-2 block">训练主题</label>
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="输入训练主题..."
                      className="w-full bg-[rgba(10,22,40,0.6)] border border-[rgba(0,212,255,0.1)] rounded-xl px-4 py-3 text-sm text-white placeholder-[#64748B] focus:outline-none focus:border-[rgba(0,212,255,0.3)] transition-colors"
                    />
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="text-white text-sm font-semibold mb-2 block">预计时长</label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full bg-[rgba(10,22,40,0.6)] border border-[rgba(0,212,255,0.1)] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[rgba(0,212,255,0.3)] transition-colors appearance-none cursor-pointer"
                    >
                      {durationOptions.map((opt) => (
                        <option key={opt} value={opt} className="bg-[#0A1628]">{opt}</option>
                      ))}
                    </select>
                  </div>

                  {/* Content */}
                  <div className="lg:col-span-2">
                    <label className="text-white text-sm font-semibold mb-2 block">训练内容</label>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="描述训练目标和具体内容..."
                      rows={4}
                      className="w-full bg-[rgba(10,22,40,0.6)] border border-[rgba(0,212,255,0.1)] rounded-xl px-4 py-3 text-sm text-white placeholder-[#64748B] focus:outline-none focus:border-[rgba(0,212,255,0.3)] transition-colors resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleStartTraining}
                    disabled={!topic.trim() || startingTraining}
                    className="energy-gradient text-white font-semibold px-8 py-3 rounded-xl flex items-center gap-2 hover:shadow-glow transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {startingTraining ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        启动中...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        开始训练
                      </>
                    )}
                  </button>
                  {selectedProject && (
                    <button
                      onClick={handleReset}
                      className="px-6 py-3 rounded-xl border border-[rgba(255,255,255,0.1)] text-[#94A3B8] text-sm font-medium hover:text-white hover:border-[rgba(255,255,255,0.2)] transition-all"
                    >
                      重置
                    </button>
                  )}
                </div>
              </motion.div>

              {/* Training Result Panel */}
              <AnimatePresence>
                {submitted && startResult && (
                  <motion.div
                    ref={resultRef}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 40 }}
                    transition={{ duration: 0.5 }}
                    className="glass-card rounded-2xl p-6 lg:p-8 mt-6"
                  >
                    {!completed ? (
                      <div>
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 rounded-xl bg-[rgba(0,212,255,0.1)] flex items-center justify-center">
                            <Brain className="w-5 h-5 text-[#00D4FF]" />
                          </div>
                          <div>
                            <h3 className="text-white text-lg font-bold">AI 训练助手</h3>
                            <p className="text-[#94A3B8] text-xs">根据你的训练计划生成的个性化建议</p>
                          </div>
                        </div>

                        {/* Plan summary */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                          <div className="bg-[rgba(10,22,40,0.5)] rounded-xl p-4">
                            <div className="text-[#64748B] text-xs mb-1">训练主题</div>
                            <div className="text-white text-sm font-semibold">{startResult.topic}</div>
                          </div>
                          <div className="bg-[rgba(10,22,40,0.5)] rounded-xl p-4">
                            <div className="text-[#64748B] text-xs mb-1">预计时长</div>
                            <div className="text-white text-sm font-semibold">{startResult.duration}分钟</div>
                          </div>
                          <div className="bg-[rgba(10,22,40,0.5)] rounded-xl p-4">
                            <div className="text-[#64748B] text-xs mb-1">训练类型</div>
                            <div className="text-white text-sm font-semibold">{currentTab.label}</div>
                          </div>
                        </div>

                        {/* AI Suggestions */}
                        <div className="bg-[rgba(10,22,40,0.5)] rounded-xl p-5 mb-6">
                          <h4 className="text-[#00D4FF] text-sm font-semibold mb-4 flex items-center gap-2">
                            <Zap className="w-4 h-4" />
                            AI 训练建议
                          </h4>
                          <div className="space-y-3">
                            {(startResult.suggestions || []).map((suggestion: string, i: number) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + i * 0.1 }}
                                className="flex items-start gap-3"
                              >
                                <div className="w-6 h-6 rounded-full bg-[rgba(0,212,255,0.1)] flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <span className="text-[#00D4FF] text-xs font-bold">{i + 1}</span>
                                </div>
                                <p className="text-[#CBD5E1] text-sm leading-relaxed">{suggestion}</p>
                              </motion.div>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={handleComplete}
                          disabled={completingTraining}
                          className="energy-gradient text-white font-semibold px-8 py-3 rounded-xl flex items-center gap-2 hover:shadow-glow transition-all duration-300 disabled:opacity-60"
                        >
                          {completingTraining ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              处理中...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              完成训练
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.5, type: 'spring' }}
                          className="w-20 h-20 rounded-full bg-[rgba(16,185,129,0.15)] flex items-center justify-center mx-auto mb-4"
                        >
                          <CheckCircle className="w-10 h-10 text-[#10B981]" />
                        </motion.div>
                        <h3 className="text-white text-xl font-bold mb-2">训练完成！</h3>
                        <p className="text-[#94A3B8] text-sm mb-2">「{startResult.topic}」训练已记录</p>
                        <p className="text-[#64748B] text-xs mb-6">继续保持，积少成多</p>
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={handleReset}
                            className="energy-gradient text-white font-semibold px-6 py-3 rounded-xl flex items-center gap-2 hover:shadow-glow transition-all"
                          >
                            <ChevronRight className="w-4 h-4" />
                            开始新训练
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* ═══════════════ Progress Section ═══════════════ */}
      <section className="py-16 lg:py-24" style={{ backgroundColor: '#0A1628' }}>
        <div className="section-container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass-card rounded-2xl p-6 lg:p-8"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-[rgba(0,212,255,0.1)] flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#00D4FF]" />
              </div>
              <div>
                <h3 className="text-white text-lg font-bold">训练进度总览</h3>
                <p className="text-[#94A3B8] text-xs">各项训练模块完成情况</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Progress bars */}
              <div className="lg:col-span-2">
                {loadingProgress ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-[#00D4FF] animate-spin" />
                    <span className="text-[#94A3B8] text-sm ml-3">加载进度...</span>
                  </div>
                ) : (
                  <>
                    {progressData.map((item, i) => (
                      <AnimatedProgressBar
                        key={item.category}
                        percentage={item.percent}
                        color={progressColorMap[item.category] || '#00D4FF'}
                        label={progressLabelMap[item.category] || item.category}
                        delay={i * 0.15}
                      />
                    ))}
                    {progressData.length === 0 && (
                      <p className="text-[#64748B] text-sm text-center py-4">暂无进度数据，开始训练吧！</p>
                    )}
                  </>
                )}

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="bg-[rgba(10,22,40,0.5)] rounded-xl p-4 text-center">
                    <div className="text-[#00D4FF] font-bold text-2xl font-outfit">
                      {sessions.filter((s) => s.status === 'completed').length}
                    </div>
                    <div className="text-[#64748B] text-xs mt-1">已完成训练</div>
                  </div>
                  <div className="bg-[rgba(10,22,40,0.5)] rounded-xl p-4 text-center">
                    <div className="text-[#8B5CF6] font-bold text-2xl font-outfit">
                      {(sessions.reduce((acc, s) => acc + (parseInt(s.duration) || 0), 0) / 60).toFixed(1)}h
                    </div>
                    <div className="text-[#64748B] text-xs mt-1">累计训练时长</div>
                  </div>
                  <div className="bg-[rgba(10,22,40,0.5)] rounded-xl p-4 text-center">
                    <div className="text-[#10B981] font-bold text-2xl font-outfit">{sessions.length}</div>
                    <div className="text-[#64748B] text-xs mt-1">总训练次数</div>
                  </div>
                </div>
              </div>

              {/* Recent activity */}
              <div>
                <h4 className="text-white text-sm font-semibold mb-4">最近训练记录</h4>
                {loadingSessions ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 text-[#00D4FF] animate-spin" />
                    <span className="text-[#94A3B8] text-xs ml-2">加载记录...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sessions.slice(0, 5).map((record, i) => {
                      const color = progressColorMap[record.category] || '#00D4FF';
                      const isCompleted = record.status === 'completed';
                      return (
                        <motion.div
                          key={record.id}
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.5, delay: i * 0.1 }}
                          className="flex items-start gap-3"
                        >
                          <div className="flex flex-col items-center">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: color }}
                            />
                            {i < Math.min(sessions.slice(0, 5).length - 1, 4) && (
                              <div className="w-0.5 h-10 bg-[rgba(0,212,255,0.15)]" />
                            )}
                          </div>
                          <div className="pb-2">
                            <div className="text-[#64748B] text-xs">
                              {new Date(record.createdAt).toLocaleDateString('zh-CN')} {new Date(record.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="text-white text-sm font-medium">{record.topic}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[#94A3B8] text-xs">{record.duration}分钟</span>
                              <span
                                className="text-xs font-semibold"
                                style={{ color }}
                              >
                                {isCompleted ? '已完成' : '进行中'}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                    {sessions.length === 0 && (
                      <p className="text-[#64748B] text-sm text-center py-4">暂无训练记录</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
