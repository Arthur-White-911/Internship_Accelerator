import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Briefcase, Building2, TrendingUp, MapPin, Search,
  ChevronRight, Zap, BarChart3, Clock, ExternalLink,
  Loader2, RefreshCw, AlertCircle,
} from 'lucide-react';
import { jobsApi, type JobsStats } from '../api/jobs';

/* ─── 分类图标映射 ─── */
const CATEGORY_ICONS: Record<string, string> = {
  'IT互联网': '💻', '软件开发': '💻', '互联网': '🌐',
  '金融': '💰', '银行': '🏦', '证券': '📈',
  '制造': '🏭', '工程': '⚙️', '机械': '🔧',
  '教育': '📚', '培训': '🎓',
  '医疗': '🏥', '医药': '💊',
  '销售': '📊', '市场': '📣', '运营': '🚀',
  '行政': '📋', '人事': '👥', 'HR': '👥',
  '物流': '🚚', '供应链': '📦',
  '设计': '🎨', '创意': '✨',
  '建筑': '🏗️', '房地产': '🏠',
  '服务业': '🤝', '餐饮': '🍽️',
};

function getCategoryIcon(name: string): string {
  for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
    if (name.includes(key)) return icon;
  }
  return '💼';
}

/* ─── 薪资格式化 ─── */
function formatSalary(val: number): string {
  if (!val || val <= 0) return '—';
  if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
  return String(val);
}

/* ─── 时间格式化 ─── */
function formatTime(iso: string | null): string {
  if (!iso) return '暂无数据';
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/* ─── 空状态组件 ─── */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 rounded-full bg-[rgba(0,212,255,0.08)] flex items-center justify-center mb-6">
        <Briefcase className="w-10 h-10 text-[#94A3B8]" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">暂无招聘数据</h3>
      <p className="text-[#94A3B8] max-w-sm leading-relaxed">
        数据将由定时任务每日自动抓取。您也可以手动触发抓取任务，获取最新苏州招聘信息。
      </p>
    </div>
  );
}

export default function JobsHome() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<JobsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    setLoading(true);
    setError('');
    try {
      const res = await jobsApi.stats();
      if (res.success) setStats(res.data);
      else setError('获取数据失败');
    } catch {
      setError('网络连接失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }

  function handleSearch() {
    const params = new URLSearchParams();
    if (keyword.trim()) params.set('keyword', keyword.trim());
    navigate(`/jobs/list?${params.toString()}`);
  }

  function handleCategoryClick(cat: string) {
    navigate(`/jobs/list?category=${encodeURIComponent(cat)}`);
  }

  return (
    <div className="min-h-screen bg-[#0A1628]">
      {/* ─── Hero 区域 ─── */}
      <section className="relative overflow-hidden pt-12 pb-16 px-4">
        {/* 背景装饰 */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[rgba(0,212,255,0.04)] rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[rgba(59,130,246,0.04)] rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[rgba(0,212,255,0.2)] bg-[rgba(0,212,255,0.06)] text-energy-cyan text-sm font-medium mb-6">
              <Zap className="w-3.5 h-3.5" />
              苏州招聘信息聚合平台
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
              发现苏州最新<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-energy-cyan to-crystal-blue">
                实习 & 招聘机会
              </span>
            </h1>
            <p className="text-[#94A3B8] text-lg mb-8 max-w-xl mx-auto">
              每日自动汇聚智联招聘、BOSS直聘等平台的苏州招聘信息，多维筛选，精准匹配
            </p>
          </motion.div>

          {/* 搜索框 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex gap-3 max-w-2xl mx-auto"
          >
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
              <input
                type="text"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="搜索职位名称或公司..."
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-white placeholder-[#64748B] focus:outline-none focus:border-energy-cyan transition-colors"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-energy-cyan to-crystal-blue hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              搜索岗位
            </button>
          </motion.div>

          {/* 数据更新时间 */}
          {stats?.last_updated && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-4 text-xs text-[#64748B] flex items-center justify-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5" />
              数据更新于 {formatTime(stats.last_updated)}
            </motion.p>
          )}
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 pb-16 space-y-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-10 h-10 text-energy-cyan animate-spin" />
            <p className="text-[#94A3B8]">正在加载招聘数据...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <AlertCircle className="w-10 h-10 text-red-400" />
            <p className="text-[#94A3B8]">{error}</p>
            <button
              onClick={fetchStats}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[rgba(255,255,255,0.1)] text-[#94A3B8] hover:text-white hover:border-energy-cyan transition-colors text-sm"
            >
              <RefreshCw className="w-4 h-4" /> 重新加载
            </button>
          </div>
        ) : !stats || stats.total_count === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* ─── 统计卡片 ─── */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: Briefcase, label: '今日新增', value: `${stats.today_count}`, unit: '个岗位', color: 'text-energy-cyan' },
                  { icon: Building2, label: '在招企业', value: `${stats.company_count}`, unit: '家', color: 'text-crystal-blue' },
                  { icon: TrendingUp, label: '平均薪资', value: formatSalary(stats.avg_salary), unit: '/月', color: 'text-green-400' },
                  { icon: BarChart3, label: '岗位总数', value: `${stats.total_count}`, unit: '个', color: 'text-purple-400' },
                ].map((card, i) => {
                  const Icon = card.icon;
                  return (
                    <motion.div
                      key={card.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.05 }}
                      className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] p-5"
                    >
                      <div className={`w-10 h-10 rounded-xl bg-[rgba(255,255,255,0.05)] flex items-center justify-center mb-3 ${card.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {card.value}<span className="text-sm font-normal text-[#64748B] ml-1">{card.unit}</span>
                      </div>
                      <div className="text-sm text-[#94A3B8] mt-1">{card.label}</div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.section>

            {/* ─── 分类导航 ─── */}
            {stats.top_categories.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-semibold text-white">热门分类</h2>
                  <button
                    onClick={() => navigate('/jobs/list')}
                    className="flex items-center gap-1 text-sm text-energy-cyan hover:opacity-80 transition-opacity"
                  >
                    查看全部 <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 gap-3">
                  {stats.top_categories.map((cat, i) => (
                    <motion.button
                      key={cat.name}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 + i * 0.04 }}
                      onClick={() => handleCategoryClick(cat.name)}
                      className="flex items-center gap-3 p-4 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] hover:border-[rgba(0,212,255,0.3)] hover:bg-[rgba(0,212,255,0.04)] transition-all text-left group"
                    >
                      <span className="text-2xl">{getCategoryIcon(cat.name)}</span>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-white truncate group-hover:text-energy-cyan transition-colors">
                          {cat.name}
                        </div>
                        <div className="text-xs text-[#64748B] mt-0.5">{cat.count} 个岗位</div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.section>
            )}

            {/* ─── 薪资最高 Top 3 ─── */}
            {stats.top_salary_jobs.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    高薪岗位
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {stats.top_salary_jobs.map((job, i) => (
                    <motion.div
                      key={job._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 + i * 0.06 }}
                      onClick={() => navigate(`/jobs/${job._id}`)}
                      className="cursor-pointer p-4 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] hover:border-[rgba(0,212,255,0.3)] hover:bg-[rgba(0,212,255,0.04)] transition-all group"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-base font-semibold text-white group-hover:text-energy-cyan transition-colors line-clamp-1">
                          {job.title}
                        </span>
                        <span className="shrink-0 text-sm font-bold text-green-400">{job.salary_text}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[#94A3B8]">
                        <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{job.company}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.district}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            )}

            {/* ─── 地区分布 + 薪资分布 ─── */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {/* 地区分布 */}
              {stats.district_stats.length > 0 && (
                <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] p-6">
                  <h3 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-energy-cyan" />
                    地区分布
                  </h3>
                  <div className="space-y-3">
                    {stats.district_stats.slice(0, 6).map(d => {
                      const max = stats.district_stats[0]?.count || 1;
                      const pct = Math.round((d.count / max) * 100);
                      return (
                        <button
                          key={d.name}
                          onClick={() => navigate(`/jobs/list?district=${encodeURIComponent(d.name)}`)}
                          className="w-full text-left group"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-[#CBD5E1] group-hover:text-energy-cyan transition-colors">{d.name}</span>
                            <span className="text-xs text-[#64748B]">{d.count}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-energy-cyan to-crystal-blue transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 薪资分布 */}
              <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] p-6">
                <h3 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-green-400" />
                  薪资分布
                </h3>
                <div className="space-y-3">
                  {stats.salary_distribution.map(b => {
                    const max = Math.max(...stats.salary_distribution.map(x => x.count), 1);
                    const pct = Math.round((b.count / max) * 100);
                    return (
                      <div key={b.label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-[#CBD5E1]">{b.label}</span>
                          <span className="text-xs text-[#64748B]">{b.count} 个</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.section>

            {/* ─── 底部 CTA ─── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
            >
              <button
                onClick={() => navigate('/jobs/list')}
                className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-energy-cyan to-crystal-blue hover:opacity-90 transition-opacity"
              >
                <Briefcase className="w-5 h-5" />
                浏览全部岗位
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate('/jobs/list?job_type=实习')}
                className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-[#CBD5E1] border border-[rgba(255,255,255,0.12)] hover:border-energy-cyan hover:text-white transition-all"
              >
                <ExternalLink className="w-5 h-5" />
                只看实习岗位
              </button>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
