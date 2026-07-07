import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  ChevronDown,
  CheckCircle2,
  Minus,
  Search,
  Settings,
  BookOpen,
  Rocket,
  ArrowRight,
  Sparkles,
  Clock,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import { useToast } from '../components/Toast';
import { programsApi } from '../api/programs';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

/* ─── Types ─── */
type TabFilter = '全部方案' | '初级方案' | '中级方案' | '高级方案';

interface Program {
  id: number;
  tier: string;
  badgeColor: string;
  price: string;
  duration: string;
  image: string;
  title: string;
  description: string;
  features: string[];
  ctaColor: string;
  ctaText: string;
  tag?: string;
  tagColor?: string;
  filterCategory: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

/* ─── Animation Variants ─── */
const easeOutExpo = [0.16, 1, 0.3, 1] as [number, number, number, number];
const easeBounce = [0.34, 1.56, 0.64, 1] as [number, number, number, number];

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

/* ─── API Data Mapper ─── */
function mapApiProgram(apiData: any): Program {
  const levelMap: Record<string, { tier: string; filterCategory: TabFilter; badgeColor: string; ctaColor: string; ctaText: string; tag?: string; tagColor?: string }> = {
    '初级': {
      tier: '入门级',
      filterCategory: '初级方案',
      badgeColor: '#10B981',
      ctaColor: 'bg-success hover:bg-[#059669]',
      ctaText: '选择入门方案',
    },
    '中级': {
      tier: '进阶级',
      filterCategory: '中级方案',
      badgeColor: '#F59E0B',
      ctaColor: 'energy-gradient',
      ctaText: '选择进阶方案',
      tag: '最受欢迎',
      tagColor: '#F59E0B',
    },
    '高级': {
      tier: '专家级',
      filterCategory: '高级方案',
      badgeColor: '#EF4444',
      ctaColor: 'bg-error hover:bg-[#DC2626]',
      ctaText: '选择专家方案',
      tag: '最佳保障',
      tagColor: '#EF4444',
    },
  };

  const meta = levelMap[apiData.level] || levelMap['初级'];

  return {
    id: apiData.id,
    tier: meta.tier,
    badgeColor: meta.badgeColor,
    price: `¥${apiData.price.toLocaleString()}`,
    duration: apiData.duration,
    image: apiData.image || '/program-starter.jpg',
    title: `${meta.tier}培养方案`,
    description: apiData.description,
    features: apiData.features || [],
    ctaColor: meta.ctaColor,
    ctaText: meta.ctaText,
    tag: meta.tag,
    tagColor: meta.tagColor,
    filterCategory: meta.filterCategory,
  };
}

/* ─── Static Data ─── */
const comparisonData = [
  { feature: '职业方向测评', starter: true, advanced: true, expert: true },
  { feature: '能力分析报告', starter: '基础版', advanced: '进阶版', expert: '深度版' },
  { feature: '技能培训', starter: '录播课程', advanced: '录播+直播', expert: '录播+直播+1对1' },
  { feature: '简历指导', starter: '模板库', advanced: '1对1精修 x 2', expert: '1对1精修 不限次' },
  { feature: '模拟面试', starter: '题库', advanced: 'AI模拟 x 5', expert: 'AI+真人 不限次' },
  { feature: '导师指导', starter: '社群答疑', advanced: '线上 x 3次', expert: '全程1对1' },
  { feature: '行业报告', starter: false, advanced: true, expert: true },
  { feature: '岗位推荐', starter: '基础推送', advanced: '优先推送', expert: '专属内推' },
  { feature: '项目实战', starter: false, advanced: false, expert: true },
  { feature: '实习保障', starter: false, advanced: false, expert: true },
];

const faqData: FAQItem[] = [
  { question: '培养方案的有效期是多久？', answer: '购买后当学期有效（约4个月），如需延期可联系客服申请一次免费延期。' },
  { question: '可以中途升级方案吗？', answer: '可以的！已购买入门级或进阶级的学员可随时补差价升级至更高级别方案。' },
  { question: '导师都是什么背景？', answer: '我们的导师均来自一线互联网大厂、知名金融机构和咨询公司，拥有5年以上工作经验。' },
  { question: '模拟面试是真人还是AI？', answer: '进阶级以AI模拟面试为主，专家级提供真人导师模拟面试。AI面试同样具备专业反馈能力。' },
  { question: '实习保障协议具体是什么？', answer: '专家级学员在完成全部训练内容后，如在学期内未获得任何实习offer，可申请全额退款。' },
  { question: '如何开始？需要准备什么？', answer: '只需在平台完成注册和职业能力测评，系统会自动为你推荐最适合的培养方案。' },
];

const processSteps = [
  { number: '01', icon: <Search className="w-6 h-6" />, title: '能力诊断', description: '通过多维测评，AI生成你的专属能力画像' },
  { number: '02', icon: <Settings className="w-6 h-6" />, title: '方案定制', description: '基于诊断结果，匹配最适合的培养方案' },
  { number: '03', icon: <BookOpen className="w-6 h-6" />, title: '系统训练', description: '按阶段完成课程、项目和模拟面试训练' },
  { number: '04', icon: <Rocket className="w-6 h-6" />, title: '岗位对接', description: '精准推荐岗位，导师辅导面试，拿到心仪offer' },
];

/* ─── Hero Section ─── */
function HeroSection({ activeTab, onTabChange }: { activeTab: TabFilter; onTabChange: (tab: TabFilter) => void }) {
  const tabs: TabFilter[] = ['全部方案', '初级方案', '中级方案', '高级方案'];

  return (
    <section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden hero-gradient">
      <div className="absolute inset-0">
        <img
          src="/program-starter.jpg"
          alt=""
          className="absolute right-0 top-1/2 -translate-y-1/2 w-1/2 h-auto opacity-20 object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-deep-space via-deep-space/95 to-deep-space/80" />
      </div>

      <div className="section-container relative z-10 py-20 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: easeOutExpo }}
          className="font-outfit text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4"
        >
          分级培养方案
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: easeOutExpo }}
          className="text-text-gray text-base sm:text-lg max-w-xl mx-auto mb-10"
        >
          三级加速体系，为你的职业目标量身定制成长路径
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.4, ease: easeOutExpo }}
          className="flex items-center justify-center gap-3 mb-10 flex-wrap"
        >
          {[
            { label: '入门级 ¥99', color: '#10B981' },
            { label: '进阶级 ¥199', color: '#F59E0B' },
            { label: '专家级 ¥299', color: '#EF4444' },
          ].map((badge, i) => (
            <motion.span
              key={badge.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.4 + i * 0.1, ease: easeBounce }}
              className="px-4 py-1.5 rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: badge.color }}
            >
              {badge.label}
            </motion.span>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6, ease: easeOutExpo }}
          className="inline-flex items-center gap-1 p-1 rounded-xl bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)]"
        >
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab ? 'text-deep-space' : 'text-text-gray hover:text-white'
              }`}
            >
              {activeTab === tab && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-energy-cyan rounded-lg"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <span className="relative z-10">{tab}</span>
            </button>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Comparison Table Section ─── */
function ComparisonTable() {
  return (
    <section className="py-16 sm:py-24 bg-light-bg">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: easeOutExpo }}
          className="text-center mb-10"
        >
          <h2 className="font-outfit text-2xl sm:text-3xl font-bold text-deep-space mb-3">方案对比一览</h2>
          <p className="text-dark-gray text-sm">清晰对比各方案功能，选择最适合你的培养路径</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="overflow-x-auto"
        >
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr>
                <th className="p-4 text-left text-white font-semibold text-sm bg-deep-space rounded-tl-xl">功能项</th>
                <th className="p-4 text-center text-white font-semibold text-sm rounded-ttr-xl" style={{ backgroundColor: '#10B981' }}>
                  入门级<div className="text-xs font-normal opacity-80">¥99</div>
                </th>
                <th className="p-4 text-center text-white font-semibold text-sm" style={{ backgroundColor: '#F59E0B' }}>
                  进阶级<div className="text-xs font-normal opacity-80">¥199</div>
                </th>
                <th className="p-4 text-center text-white font-semibold text-sm rounded-tr-xl" style={{ backgroundColor: '#EF4444' }}>
                  专家级<div className="text-xs font-normal opacity-80">¥299</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((row, index) => (
                <motion.tr
                  key={row.feature}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.05, ease: easeOutExpo }}
                  className={index % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'}
                >
                  <td className="p-4 text-deep-space text-sm font-medium border border-[#E2E8F0]">{row.feature}</td>
                  <td className="p-4 text-center border border-[#E2E8F0]">
                    {typeof row.starter === 'boolean' ? (
                      row.starter ? (
                        <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.3, delay: 0.5 + index * 0.03, ease: easeBounce }}>
                          <CheckCircle2 className="w-5 h-5 text-energy-cyan mx-auto" />
                        </motion.div>
                      ) : (
                        <Minus className="w-5 h-5 text-[#CBD5E1] mx-auto" />
                      )
                    ) : (
                      <span className="text-dark-gray text-sm">{row.starter}</span>
                    )}
                  </td>
                  <td className="p-4 text-center border border-[#E2E8F0] bg-[rgba(245,158,11,0.03)]">
                    {typeof row.advanced === 'boolean' ? (
                      row.advanced ? (
                        <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.3, delay: 0.5 + index * 0.03, ease: easeBounce }}>
                          <CheckCircle2 className="w-5 h-5 text-energy-cyan mx-auto" />
                        </motion.div>
                      ) : (
                        <Minus className="w-5 h-5 text-[#CBD5E1] mx-auto" />
                      )
                    ) : (
                      <span className="text-dark-gray text-sm">{row.advanced}</span>
                    )}
                  </td>
                  <td className="p-4 text-center border border-[#E2E8F0]">
                    {typeof row.expert === 'boolean' ? (
                      row.expert ? (
                        <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.3, delay: 0.5 + index * 0.03, ease: easeBounce }}>
                          <CheckCircle2 className="w-5 h-5 text-energy-cyan mx-auto" />
                        </motion.div>
                      ) : (
                        <Minus className="w-5 h-5 text-[#CBD5E1] mx-auto" />
                      )
                    ) : (
                      <span className="text-dark-gray text-sm">{row.expert}</span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Program Card ─── */
function ProgramCard({
  program,
  index,
  onEnroll,
  enrollingId,
}: {
  program: Program;
  index: number;
  onEnroll: (id: number) => void;
  enrollingId: number | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const isEven = index % 2 === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8, ease: easeOutExpo }}
      className="glass-card rounded-2xl p-6 sm:p-8 lg:p-12 transition-all duration-400 hover:border-[rgba(0,212,255,0.2)] hover:-translate-y-1"
    >
      <div className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-8 lg:gap-12`}>
        {/* Image */}
        <motion.div
          initial={{ opacity: 0, scale: 1.05 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2, ease: easeOutExpo }}
          className="lg:w-[40%] flex-shrink-0"
        >
          <div className="relative rounded-xl overflow-hidden">
            <img
              src={program.image}
              alt={program.title}
              className="w-full h-48 sm:h-56 lg:h-64 object-cover rounded-xl"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <div className="hidden w-full h-48 sm:h-56 lg:h-64 rounded-xl items-center justify-center" style={{ backgroundColor: `${program.badgeColor}15` }}>
              <GraduationCap className="w-16 h-16" style={{ color: program.badgeColor, opacity: 0.5 }} />
            </div>
            {program.tag && (
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: program.tagColor }}>
                {program.tag}
              </div>
            )}
          </div>
        </motion.div>

        {/* Content */}
        <div className="lg:w-[60%] flex flex-col">
          <div className="flex items-center gap-3 mb-3">
            <span className="px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: program.badgeColor }}>
              {program.tier}
            </span>
            <div className="flex items-center gap-1 text-text-gray text-xs">
              <Clock className="w-3.5 h-3.5" />
              {program.duration}
            </div>
          </div>

          <h3 className="font-outfit text-xl sm:text-2xl font-bold text-white mb-2">{program.title}</h3>

          <p className="text-energy-cyan font-jetbrains text-2xl sm:text-3xl font-bold mb-4">
            {program.price}
            <span className="text-text-gray text-sm font-normal">/学期</span>
          </p>

          <p className="text-text-gray text-sm leading-relaxed mb-6">{program.description}</p>

          {/* Features list */}
          <motion.ul
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-2.5 mb-6"
          >
            {program.features.map((feature) => (
              <motion.li
                key={feature}
                variants={{
                  hidden: { opacity: 0, x: 20 },
                  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: easeOutExpo } },
                }}
                className="flex items-start gap-3"
              >
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: program.badgeColor }} />
                <span className="text-white/80 text-sm">{feature}</span>
              </motion.li>
            ))}
          </motion.ul>

          {/* Expandable details */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: easeOutExpo }}
                className="overflow-hidden"
              >
                <div className="pt-4 pb-6 border-t border-[rgba(255,255,255,0.08)]">
                  <h4 className="text-white font-semibold text-sm mb-3">完整服务清单</h4>
                  <ol className="space-y-2">
                    {program.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-text-gray text-sm">
                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ backgroundColor: program.badgeColor }}>
                          {i + 1}
                        </span>
                        {f}
                      </li>
                    ))}
                  </ol>
                  <p className="text-text-gray text-sm mt-4 leading-relaxed">
                    本方案专为{program.tier}学员设计，涵盖从基础能力评估到实战技能训练的全流程服务。选择此方案，你将获得系统化的职业培养体验。
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Buttons */}
          <div className="flex flex-wrap items-center gap-3 mt-auto pt-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[rgba(255,255,255,0.12)] text-white text-sm font-medium hover:bg-white/5 transition-all duration-200"
            >
              {expanded ? '收起详情' : '查看详情'}
              <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
                <ChevronDown className="w-4 h-4" />
              </motion.div>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onEnroll(program.id)}
              disabled={enrollingId === program.id}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-medium shadow-glow transition-all duration-200 ${program.ctaColor} disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {enrollingId === program.id ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  报名中...
                </>
              ) : (
                <>
                  {program.ctaText}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Programs Detail Section ─── */
function ProgramsDetailSection({
  activeTab,
  programs,
  onEnroll,
  enrollingId,
  loading,
}: {
  activeTab: TabFilter;
  programs: Program[];
  onEnroll: (id: number) => void;
  enrollingId: number | null;
  loading: boolean;
}) {
  const filteredPrograms =
    activeTab === '全部方案' ? programs : programs.filter((p) => p.filterCategory === activeTab);

  return (
    <section className="py-16 sm:py-24 bg-deep-space">
      <div className="section-container space-y-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-energy-cyan animate-spin mb-4" />
            <p className="text-text-gray text-sm">加载培养方案...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-12"
            >
              {filteredPrograms.length === 0 ? (
                <div className="text-center py-16">
                  <GraduationCap className="w-12 h-12 text-text-gray mx-auto mb-4 opacity-30" />
                  <p className="text-text-gray text-sm">暂无该分类的培养方案</p>
                </div>
              ) : (
                filteredPrograms.map((program, index) => (
                  <ProgramCard key={program.id} program={program} index={index} onEnroll={onEnroll} enrollingId={enrollingId} />
                ))
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </section>
  );
}

/* ─── Process Section ─── */
function ProcessSection() {
  return (
    <section className="py-16 sm:py-24 bg-light-bg">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: easeOutExpo }}
          className="text-center mb-12"
        >
          <h2 className="font-outfit text-2xl sm:text-3xl font-bold text-deep-space mb-3">你的加速路径</h2>
          <p className="text-dark-gray text-sm">清晰的四步流程，从诊断到就业</p>
        </motion.div>

        <div className="relative">
          <div className="hidden lg:block absolute top-[80px] left-[12.5%] right-[12.5%] h-[2px]">
            <div className="absolute inset-0 bg-gradient-to-r from-energy-cyan via-crystal-blue to-neon-purple" />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="absolute top-0 left-0 w-1/3 h-full bg-white/50 blur-sm"
            />
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {processSteps.map((step, index) => (
              <motion.div
                key={step.number}
                variants={{
                  hidden: { opacity: 0, y: 50 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.7, delay: index * 0.15, ease: easeOutExpo } },
                }}
                className="relative bg-white rounded-2xl shadow-md p-8 text-center"
              >
                <span className="font-jetbrains text-4xl sm:text-5xl font-bold bg-gradient-to-r from-[#00D4FF] to-[#6366F1] bg-clip-text text-transparent block mb-4">
                  {step.number}
                </span>
                <div className="w-14 h-14 rounded-full bg-[rgba(0,212,255,0.1)] flex items-center justify-center text-energy-cyan mx-auto mb-4">
                  {step.icon}
                </div>
                <h3 className="font-outfit text-lg font-semibold text-deep-space mb-2">{step.title}</h3>
                <p className="text-dark-gray text-sm leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── FAQ Section ─── */
function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-16 sm:py-24 bg-deep-space">
      <div className="section-container max-w-[800px]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: easeOutExpo }}
          className="text-center mb-10"
        >
          <h2 className="font-outfit text-2xl sm:text-3xl font-bold text-white mb-3">常见问题</h2>
          <p className="text-text-gray text-sm">关于培养方案的常见疑问解答</p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="space-y-3"
        >
          {faqData.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <motion.div
                key={index}
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: index * 0.08, ease: easeOutExpo } },
                }}
                className={`rounded-xl border transition-all duration-200 ${
                  isOpen ? 'border-[rgba(0,212,255,0.2)] bg-[rgba(30,58,95,0.3)]' : 'border-[rgba(0,212,255,0.08)] bg-[rgba(30,58,95,0.3)] hover:border-[rgba(0,212,255,0.2)]'
                }`}
              >
                <button onClick={() => setOpenIndex(isOpen ? null : index)} className="w-full flex items-center justify-between p-5 sm:p-6 text-left">
                  <span className="text-white text-sm font-semibold pr-4">{faq.question}</span>
                  <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }} className="flex-shrink-0">
                    <ChevronDown className="w-5 h-5 text-energy-cyan" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: easeOutExpo }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 sm:px-6 pb-5 sm:pb-6">
                        <p className="text-text-gray text-sm leading-relaxed">{faq.answer}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── CTA Section ─── */
function CTASection() {
  return (
    <section className="py-16 sm:py-24 bg-light-bg">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: easeOutExpo }}
        className="section-container text-center"
      >
        <h2 className="font-outfit text-2xl sm:text-3xl font-bold text-deep-space mb-4">不确定哪个方案适合你？</h2>
        <p className="text-[#64748B] text-base sm:text-lg max-w-lg mx-auto mb-8">
          先做一次免费的能力测评，AI会为你推荐最适合的培养方案
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <motion.a
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            href="#/assessment"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl energy-gradient text-white font-medium shadow-glow hover:shadow-glow-cyan transition-all duration-200"
          >
            <Sparkles className="w-5 h-5" />
            免费测评
          </motion.a>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl border border-[#E2E8F0] text-deep-space font-medium hover:bg-white transition-all duration-200"
          >
            <MessageSquare className="w-5 h-5" />
            联系顾问
          </motion.button>
        </div>
      </motion.div>
    </section>
  );
}

/* ─── Main Page ─── */
export default function Programs() {
  const [activeTab, setActiveTab] = useState<TabFilter>('全部方案');
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState<number | null>(null);
  const toast = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  /* ── Fetch programs on mount ── */
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        setLoading(true);
        const res = await programsApi.list();
        if (res.success && Array.isArray(res.data)) {
          setPrograms(res.data.map(mapApiProgram));
        } else {
          toast('获取培养方案失败', 'error');
        }
      } catch (err: any) {
        toast(err?.message || '获取培养方案失败，请稍后重试', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchPrograms();
  }, [toast]);

  /* ── Handle enroll ── */
  const handleEnroll = async (id: number) => {
    if (!user) {
      toast('请先登录后再报名', 'error');
      navigate('/login');
      return;
    }
    try {
      setEnrollingId(id);
      const res = await programsApi.enroll(id);
      if (res.success) {
        toast(res.message || '报名成功！', 'success');
      } else {
        toast(res.message || '报名失败', 'error');
      }
    } catch (err: any) {
      toast(err?.message || '报名失败，请稍后重试', 'error');
    } finally {
      setEnrollingId(null);
    }
  };

  return (
    <main className="min-h-[100dvh]">
      <HeroSection activeTab={activeTab} onTabChange={setActiveTab} />
      <ComparisonTable />
      <ProgramsDetailSection activeTab={activeTab} programs={programs} onEnroll={handleEnroll} enrollingId={enrollingId} loading={loading} />
      <ProcessSection />
      <FAQSection />
      <CTASection />
    </main>
  );
}
