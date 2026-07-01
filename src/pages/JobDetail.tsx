import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronLeft, Building2, MapPin, GraduationCap, Clock,
  Briefcase, ExternalLink, Share2, Calendar, Tag,
  Loader2, AlertCircle, CheckCircle2, Users, Globe,
} from 'lucide-react';
import { jobsApi, type Job } from '../api/jobs';

/* ─── 工具函数 ─── */
function formatSalary(min: number | null, max: number | null, text: string): string {
  if (text && text !== '薪资面议') return text;
  if (!min && !max) return '薪资面议';
  const fmt = (v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v);
  if (min && max && min !== max) return `${fmt(min)}-${fmt(max)}/月`;
  if (min) return `${fmt(min)}起/月`;
  return '薪资面议';
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const today = new Date().toISOString().slice(0, 10);
  if (dateStr === today) return '今天发布';
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (dateStr === yesterday) return '昨天发布';
  return `${dateStr} 发布`;
}

const PLATFORM_COLORS: Record<string, string> = {
  '智联招聘': 'from-blue-500 to-blue-600',
  'BOSS直聘': 'from-emerald-500 to-emerald-600',
  '前程无忧': 'from-amber-500 to-amber-600',
  '猎聘': 'from-purple-500 to-purple-600',
};

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    jobsApi.detail(id).then(res => {
      if (res.success) setJob(res.data);
      else setError('岗位不存在或已下线');
    }).catch(() => {
      setError('网络连接失败，请稍后重试');
    }).finally(() => setLoading(false));
  }, [id]);

  function handleShare() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A1628] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-energy-cyan animate-spin" />
          <p className="text-[#94A3B8]">正在加载岗位详情...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-[#0A1628] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="w-12 h-12 text-red-400" />
          <div>
            <p className="text-white font-semibold mb-1">{error || '岗位不存在'}</p>
            <p className="text-sm text-[#94A3B8]">该岗位可能已下线或链接有误</p>
          </div>
          <button
            onClick={() => navigate('/jobs/list')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[rgba(255,255,255,0.1)] text-[#94A3B8] hover:text-white hover:border-energy-cyan transition-all text-sm"
          >
            <ChevronLeft className="w-4 h-4" /> 返回岗位列表
          </button>
        </div>
      </div>
    );
  }

  const platformGradient = PLATFORM_COLORS[job.source_platform] || 'from-[#1E3A5F] to-[#0F2744]';

  return (
    <div className="min-h-screen bg-[#0A1628]">
      {/* ─── 顶部导航 ─── */}
      <div className="sticky top-[72px] z-20 bg-[rgba(10,22,40,0.95)] backdrop-blur-xl border-b border-[rgba(255,255,255,0.06)] px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-[#94A3B8] hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            返回列表
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[#94A3B8] hover:text-white border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.2)] transition-all"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Share2 className="w-3.5 h-3.5" />}
              {copied ? '已复制' : '分享'}
            </button>
            {job.source_url && (
              <a
                href={job.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-gradient-to-r from-energy-cyan to-crystal-blue hover:opacity-90 transition-opacity"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                查看原网页
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-6"
        >
          {/* ─── 岗位头部卡片 ─── */}
          <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] overflow-hidden">
            {/* 顶部渐变条 */}
            <div className={`h-1.5 bg-gradient-to-r ${platformGradient}`} />

            <div className="p-6 md:p-8">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="min-w-0">
                  <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">
                    {job.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 text-[#94A3B8]">
                    <span className="flex items-center gap-1.5 text-base font-medium text-white">
                      <Building2 className="w-4 h-4 text-energy-cyan" />
                      {job.company}
                    </span>
                    {job.company_type && (
                      <span className="px-2 py-0.5 rounded text-xs bg-[rgba(255,255,255,0.06)] text-[#94A3B8]">
                        {job.company_type}
                      </span>
                    )}
                    {job.company_size && (
                      <span className="flex items-center gap-1 text-sm">
                        <Users className="w-3.5 h-3.5" />
                        {job.company_size}
                      </span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-2xl font-bold text-green-400">
                    {formatSalary(job.salary_min, job.salary_max, job.salary_text)}
                  </div>
                </div>
              </div>

              {/* 基本信息标签 */}
              <div className="flex flex-wrap gap-3 py-4 border-t border-b border-[rgba(255,255,255,0.06)] my-4">
                {[
                  { icon: MapPin, label: job.district, color: 'text-energy-cyan' },
                  { icon: Clock, label: job.experience || '经验不限', color: 'text-blue-400' },
                  { icon: GraduationCap, label: job.education || '学历不限', color: 'text-purple-400' },
                  { icon: Briefcase, label: job.job_type || '全职', color: 'text-amber-400' },
                  { icon: Calendar, label: formatDate(job.publish_date), color: 'text-[#94A3B8]' },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-center gap-1.5 text-sm text-[#CBD5E1]">
                      <Icon className={`w-4 h-4 ${item.color}`} />
                      {item.label}
                    </div>
                  );
                })}
              </div>

              {/* 福利标签 */}
              {job.tags && job.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {job.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full text-xs bg-[rgba(0,212,255,0.08)] text-energy-cyan border border-[rgba(0,212,255,0.15)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ─── 职位描述 ─── */}
          {job.description && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] p-6 md:p-8"
            >
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5 text-energy-cyan" />
                职位描述
              </h2>
              <div className="text-[#CBD5E1] leading-relaxed whitespace-pre-wrap text-sm">
                {job.description}
              </div>
            </motion.div>
          )}

          {/* ─── 岗位信息 ─── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] p-6 md:p-8"
          >
            <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-purple-400" />
              岗位信息
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: '所在区域', value: job.district },
                { label: '详细地址', value: job.address || '—' },
                { label: '经验要求', value: job.experience || '不限' },
                { label: '学历要求', value: job.education || '不限' },
                { label: '职位类型', value: job.job_type || '全职' },
                { label: '行业分类', value: job.category || '—' },
                { label: '公司性质', value: job.company_type || '—' },
                { label: '公司规模', value: job.company_size || '—' },
                { label: '来源平台', value: job.source_platform || '—' },
              ].map(item => (
                <div key={item.label}>
                  <div className="text-xs text-[#64748B] mb-1">{item.label}</div>
                  <div className="text-sm text-[#CBD5E1] font-medium">{item.value}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ─── 底部操作区 ─── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            {job.source_url && (
              <a
                href={job.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-energy-cyan to-crystal-blue hover:opacity-90 transition-opacity"
              >
                <Globe className="w-5 h-5" />
                前往 {job.source_platform} 投递简历
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            <button
              onClick={() => navigate('/jobs/list')}
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-medium text-[#CBD5E1] border border-[rgba(255,255,255,0.12)] hover:border-energy-cyan hover:text-white transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              返回列表
            </button>
            <button
              onClick={() => navigate('/interview')}
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-medium text-[#CBD5E1] border border-[rgba(255,255,255,0.12)] hover:border-purple-400 hover:text-white transition-all"
            >
              <Briefcase className="w-4 h-4" />
              练习面试
            </button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
