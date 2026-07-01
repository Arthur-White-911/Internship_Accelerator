import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, SlidersHorizontal, X, ChevronLeft, ChevronRight,
  Briefcase, Building2, MapPin, GraduationCap, Clock,
  TrendingUp, BarChart3, Loader2, AlertCircle, RefreshCw,
  ExternalLink, Filter,
} from 'lucide-react';
import { jobsApi, type Job, type JobsFilters, type JobsQueryParams } from '../api/jobs';

/* ─── 工具函数 ─── */
function formatSalary(min: number | null, max: number | null, text: string): string {
  if (text && text !== '薪资面议') return text;
  if (!min && !max) return '薪资面议';
  const fmt = (v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v);
  if (min && max && min !== max) return `${fmt(min)}-${fmt(max)}`;
  if (min) return `${fmt(min)}起`;
  return '薪资面议';
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const today = new Date().toISOString().slice(0, 10);
  if (dateStr === today) return '今天';
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (dateStr === yesterday) return '昨天';
  return dateStr;
}

const PLATFORM_COLORS: Record<string, string> = {
  '智联招聘': 'bg-[rgba(59,130,246,0.15)] text-blue-400 border-[rgba(59,130,246,0.2)]',
  'BOSS直聘': 'bg-[rgba(16,185,129,0.15)] text-emerald-400 border-[rgba(16,185,129,0.2)]',
  '前程无忧': 'bg-[rgba(245,158,11,0.15)] text-amber-400 border-[rgba(245,158,11,0.2)]',
  '猎聘': 'bg-[rgba(168,85,247,0.15)] text-purple-400 border-[rgba(168,85,247,0.2)]',
};

/* ─── 岗位卡片 ─── */
function JobCard({ job, onClick }: { job: Job; onClick: () => void }) {
  const platformClass = PLATFORM_COLORS[job.source_platform] ||
    'bg-[rgba(255,255,255,0.06)] text-[#94A3B8] border-[rgba(255,255,255,0.1)]';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="cursor-pointer p-5 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] hover:border-[rgba(0,212,255,0.25)] hover:bg-[rgba(0,212,255,0.03)] transition-all group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-white group-hover:text-energy-cyan transition-colors line-clamp-1 mb-1">
            {job.title}
          </h3>
          <div className="flex items-center gap-1.5 text-sm text-[#94A3B8]">
            <Building2 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{job.company}</span>
            {job.company_type && (
              <span className="shrink-0 px-1.5 py-0.5 rounded text-xs bg-[rgba(255,255,255,0.05)] text-[#64748B]">
                {job.company_type}
              </span>
            )}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-base font-bold text-green-400">
            {formatSalary(job.salary_min, job.salary_max, job.salary_text)}
          </div>
          {job.company_size && (
            <div className="text-xs text-[#64748B] mt-0.5">{job.company_size}</div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="flex items-center gap-1 text-xs text-[#94A3B8]">
          <MapPin className="w-3 h-3" />{job.district}
        </span>
        {job.experience && job.experience !== '不限' && (
          <span className="flex items-center gap-1 text-xs text-[#94A3B8]">
            <Clock className="w-3 h-3" />{job.experience}
          </span>
        )}
        {job.education && job.education !== '不限' && (
          <span className="flex items-center gap-1 text-xs text-[#94A3B8]">
            <GraduationCap className="w-3 h-3" />{job.education}
          </span>
        )}
        {job.job_type && job.job_type !== '全职' && (
          <span className="px-2 py-0.5 rounded-full text-xs bg-[rgba(0,212,255,0.1)] text-energy-cyan border border-[rgba(0,212,255,0.2)]">
            {job.job_type}
          </span>
        )}
      </div>

      {job.tags && job.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {job.tags.slice(0, 4).map(tag => (
            <span key={tag} className="px-2 py-0.5 rounded text-xs bg-[rgba(255,255,255,0.05)] text-[#94A3B8]">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className={`px-2 py-0.5 rounded text-xs border ${platformClass}`}>
          {job.source_platform}
        </span>
        <span className="text-xs text-[#64748B]">{formatDate(job.publish_date)}</span>
      </div>
    </motion.div>
  );
}

/* ─── 筛选标签 ─── */
function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-[rgba(0,212,255,0.1)] text-energy-cyan border border-[rgba(0,212,255,0.2)]">
      {label}
      <button onClick={onRemove} className="hover:text-white transition-colors ml-0.5">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

/* ─── 主组件 ─── */
export default function JobsList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // 筛选状态（从 URL 初始化）
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>(
    searchParams.getAll('district')
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    searchParams.getAll('category')
  );
  const [selectedEducations, setSelectedEducations] = useState<string[]>(
    searchParams.getAll('education')
  );
  const [selectedExperience, setSelectedExperience] = useState(searchParams.get('experience') || '');
  const [salaryMin, setSalaryMin] = useState(searchParams.get('salary_min') || '');
  const [salaryMax, setSalaryMax] = useState(searchParams.get('salary_max') || '');
  const [jobType, setJobType] = useState(searchParams.get('job_type') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'date_desc');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  // 数据状态
  const [jobs, setJobs] = useState<Job[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, total_pages: 0 });
  const [filterStats, setFilterStats] = useState({ total: 0, avg_salary: 0, median_salary: 0 });
  const [filters, setFilters] = useState<JobsFilters | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // 加载筛选选项
  useEffect(() => {
    jobsApi.filters().then(res => {
      if (res.success) setFilters(res.data);
    }).catch(() => {});
  }, []);

  // 构建查询参数
  const buildParams = useCallback((): JobsQueryParams => {
    const params: JobsQueryParams = { page, limit: 20, sort };
    if (keyword.trim()) params.keyword = keyword.trim();
    if (selectedDistricts.length > 0) params.district = selectedDistricts;
    if (selectedCategories.length > 0) params.category = selectedCategories;
    if (selectedEducations.length > 0) params.education = selectedEducations;
    if (selectedExperience) params.experience = selectedExperience;
    if (salaryMin) params.salary_min = Number(salaryMin);
    if (salaryMax) params.salary_max = Number(salaryMax);
    if (jobType) params.job_type = jobType;
    return params;
  }, [page, sort, keyword, selectedDistricts, selectedCategories, selectedEducations,
      selectedExperience, salaryMin, salaryMax, jobType]);

  // 同步 URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (keyword.trim()) params.set('keyword', keyword.trim());
    selectedDistricts.forEach(d => params.append('district', d));
    selectedCategories.forEach(c => params.append('category', c));
    selectedEducations.forEach(e => params.append('education', e));
    if (selectedExperience) params.set('experience', selectedExperience);
    if (salaryMin) params.set('salary_min', salaryMin);
    if (salaryMax) params.set('salary_max', salaryMax);
    if (jobType) params.set('job_type', jobType);
    if (sort !== 'date_desc') params.set('sort', sort);
    if (page > 1) params.set('page', String(page));
    setSearchParams(params, { replace: true });
  }, [keyword, selectedDistricts, selectedCategories, selectedEducations,
      selectedExperience, salaryMin, salaryMax, jobType, sort, page, setSearchParams]);

  // 加载数据
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    const params = buildParams();
    jobsApi.list(params).then(res => {
      if (cancelled) return;
      if (res.success) {
        setJobs(res.data.items);
        setPagination(res.data.pagination);
        setFilterStats(res.data.filter_stats);
      } else {
        setError('获取数据失败');
      }
    }).catch(() => {
      if (!cancelled) setError('网络连接失败，请稍后重试');
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [buildParams]);

  function handleSearch() {
    setPage(1);
  }

  function resetFilters() {
    setKeyword('');
    setSelectedDistricts([]);
    setSelectedCategories([]);
    setSelectedEducations([]);
    setSelectedExperience('');
    setSalaryMin('');
    setSalaryMax('');
    setJobType('');
    setSort('date_desc');
    setPage(1);
  }

  function toggleMulti(val: string, list: string[], setList: (v: string[]) => void) {
    setPage(1);
    if (list.includes(val)) setList(list.filter(x => x !== val));
    else setList([...list, val]);
  }

  const hasActiveFilters = selectedDistricts.length > 0 || selectedCategories.length > 0 ||
    selectedEducations.length > 0 || selectedExperience || salaryMin || salaryMax || jobType || keyword.trim();

  const formatSalaryNum = (v: number) => v > 0 ? `${(v / 1000).toFixed(1)}K` : '—';

  return (
    <div className="min-h-screen bg-[#0A1628]">
      {/* ─── 顶部搜索栏 ─── */}
      <div className="sticky top-[72px] z-30 bg-[rgba(10,22,40,0.95)] backdrop-blur-xl border-b border-[rgba(255,255,255,0.06)] px-4 py-3">
        <div className="max-w-6xl mx-auto">
          <div className="flex gap-3 items-center">
            <button
              onClick={() => navigate('/jobs')}
              className="shrink-0 p-2 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
              <input
                ref={searchInputRef}
                type="text"
                value={keyword}
                onChange={e => { setKeyword(e.target.value); setPage(1); }}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="搜索职位或公司..."
                className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#64748B] text-sm focus:outline-none focus:border-energy-cyan transition-colors"
              />
            </div>
            <select
              value={sort}
              onChange={e => { setSort(e.target.value); setPage(1); }}
              className="shrink-0 px-3 py-2.5 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-sm text-[#CBD5E1] focus:outline-none focus:border-energy-cyan transition-colors"
            >
              <option value="date_desc">最新发布</option>
              <option value="salary_desc">薪资最高</option>
              <option value="salary_asc">薪资最低</option>
            </select>
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                showFilterPanel || hasActiveFilters
                  ? 'bg-[rgba(0,212,255,0.1)] text-energy-cyan border border-[rgba(0,212,255,0.3)]'
                  : 'bg-[rgba(255,255,255,0.05)] text-[#94A3B8] border border-[rgba(255,255,255,0.08)] hover:text-white'
              }`}
            >
              <Filter className="w-4 h-4" />
              筛选
              {hasActiveFilters && (
                <span className="w-4 h-4 rounded-full bg-energy-cyan text-[#0A1628] text-xs font-bold flex items-center justify-center">
                  !
                </span>
              )}
            </button>
          </div>

          {/* 已选筛选标签 */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mt-2.5 items-center">
              {selectedDistricts.map(d => (
                <FilterTag key={d} label={d} onRemove={() => toggleMulti(d, selectedDistricts, setSelectedDistricts)} />
              ))}
              {selectedCategories.map(c => (
                <FilterTag key={c} label={c} onRemove={() => toggleMulti(c, selectedCategories, setSelectedCategories)} />
              ))}
              {selectedEducations.map(e => (
                <FilterTag key={e} label={e} onRemove={() => toggleMulti(e, selectedEducations, setSelectedEducations)} />
              ))}
              {selectedExperience && (
                <FilterTag label={selectedExperience} onRemove={() => setSelectedExperience('')} />
              )}
              {jobType && (
                <FilterTag label={jobType} onRemove={() => setJobType('')} />
              )}
              {(salaryMin || salaryMax) && (
                <FilterTag
                  label={`薪资 ${salaryMin ? salaryMin + '元' : '不限'} - ${salaryMax ? salaryMax + '元' : '不限'}`}
                  onRemove={() => { setSalaryMin(''); setSalaryMax(''); }}
                />
              )}
              <button
                onClick={resetFilters}
                className="text-xs text-[#64748B] hover:text-red-400 transition-colors flex items-center gap-1"
              >
                <X className="w-3 h-3" /> 清除全部
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── 筛选面板（展开） ─── */}
      <AnimatePresence>
        {showFilterPanel && filters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-b border-[rgba(255,255,255,0.06)] bg-[rgba(10,22,40,0.98)]"
          >
            <div className="max-w-6xl mx-auto px-4 py-5 space-y-5">
              {/* 地区 */}
              <div>
                <div className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-2.5">地区</div>
                <div className="flex flex-wrap gap-2">
                  {filters.districts.map(d => (
                    <button
                      key={d}
                      onClick={() => {
                        if (d === '苏州全市') { setSelectedDistricts([]); setPage(1); }
                        else toggleMulti(d, selectedDistricts, setSelectedDistricts);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                        (d === '苏州全市' && selectedDistricts.length === 0) || selectedDistricts.includes(d)
                          ? 'bg-[rgba(0,212,255,0.15)] text-energy-cyan border border-[rgba(0,212,255,0.3)]'
                          : 'bg-[rgba(255,255,255,0.04)] text-[#94A3B8] border border-[rgba(255,255,255,0.08)] hover:text-white hover:border-[rgba(255,255,255,0.2)]'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* 学历 */}
              <div>
                <div className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-2.5">学历要求</div>
                <div className="flex flex-wrap gap-2">
                  {filters.educations.map(e => (
                    <button
                      key={e}
                      onClick={() => toggleMulti(e, selectedEducations, setSelectedEducations)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                        selectedEducations.includes(e)
                          ? 'bg-[rgba(0,212,255,0.15)] text-energy-cyan border border-[rgba(0,212,255,0.3)]'
                          : 'bg-[rgba(255,255,255,0.04)] text-[#94A3B8] border border-[rgba(255,255,255,0.08)] hover:text-white hover:border-[rgba(255,255,255,0.2)]'
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* 经验 */}
              <div>
                <div className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-2.5">工作经验</div>
                <div className="flex flex-wrap gap-2">
                  {filters.experiences.map(e => (
                    <button
                      key={e}
                      onClick={() => { setSelectedExperience(selectedExperience === e ? '' : e); setPage(1); }}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                        selectedExperience === e
                          ? 'bg-[rgba(0,212,255,0.15)] text-energy-cyan border border-[rgba(0,212,255,0.3)]'
                          : 'bg-[rgba(255,255,255,0.04)] text-[#94A3B8] border border-[rgba(255,255,255,0.08)] hover:text-white hover:border-[rgba(255,255,255,0.2)]'
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* 职位类型 */}
              <div>
                <div className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-2.5">职位类型</div>
                <div className="flex flex-wrap gap-2">
                  {filters.job_types.map(t => (
                    <button
                      key={t}
                      onClick={() => { setJobType(jobType === t ? '' : t); setPage(1); }}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                        jobType === t
                          ? 'bg-[rgba(0,212,255,0.15)] text-energy-cyan border border-[rgba(0,212,255,0.3)]'
                          : 'bg-[rgba(255,255,255,0.04)] text-[#94A3B8] border border-[rgba(255,255,255,0.08)] hover:text-white hover:border-[rgba(255,255,255,0.2)]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* 薪资区间 */}
              <div>
                <div className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-2.5">薪资区间（元/月）</div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={salaryMin}
                    onChange={e => { setSalaryMin(e.target.value); setPage(1); }}
                    placeholder="最低薪资"
                    className="w-32 px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-sm text-white placeholder-[#64748B] focus:outline-none focus:border-energy-cyan transition-colors"
                  />
                  <span className="text-[#64748B]">—</span>
                  <input
                    type="number"
                    value={salaryMax}
                    onChange={e => { setSalaryMax(e.target.value); setPage(1); }}
                    placeholder="最高薪资"
                    className="w-32 px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-sm text-white placeholder-[#64748B] focus:outline-none focus:border-energy-cyan transition-colors"
                  />
                </div>
              </div>

              {/* 分类（动态） */}
              {filters.categories.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-2.5">行业分类</div>
                  <div className="flex flex-wrap gap-2">
                    {filters.categories.slice(0, 16).map(c => (
                      <button
                        key={c}
                        onClick={() => toggleMulti(c, selectedCategories, setSelectedCategories)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                          selectedCategories.includes(c)
                            ? 'bg-[rgba(0,212,255,0.15)] text-energy-cyan border border-[rgba(0,212,255,0.3)]'
                            : 'bg-[rgba(255,255,255,0.04)] text-[#94A3B8] border border-[rgba(255,255,255,0.08)] hover:text-white hover:border-[rgba(255,255,255,0.2)]'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setShowFilterPanel(false)}
                  className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-energy-cyan to-crystal-blue hover:opacity-90 transition-opacity"
                >
                  收起筛选
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── 主内容区 ─── */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* 左侧：岗位列表 */}
          <div className="flex-1 min-w-0">
            {/* 结果数量 */}
            {!loading && (
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-[#94A3B8]">
                  共找到 <span className="text-white font-semibold">{filterStats.total}</span> 个岗位
                </p>
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Loader2 className="w-10 h-10 text-energy-cyan animate-spin" />
                <p className="text-[#94A3B8]">正在加载岗位数据...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <AlertCircle className="w-10 h-10 text-red-400" />
                <p className="text-[#94A3B8]">{error}</p>
                <button
                  onClick={() => setPage(p => p)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[rgba(255,255,255,0.1)] text-[#94A3B8] hover:text-white transition-colors text-sm"
                >
                  <RefreshCw className="w-4 h-4" /> 重试
                </button>
              </div>
            ) : jobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                <SlidersHorizontal className="w-10 h-10 text-[#64748B]" />
                <div>
                  <p className="text-white font-medium mb-1">未找到符合条件的岗位</p>
                  <p className="text-sm text-[#94A3B8]">请调整筛选条件后重试</p>
                </div>
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 rounded-lg border border-[rgba(255,255,255,0.1)] text-[#94A3B8] hover:text-white transition-colors text-sm"
                >
                  清除所有筛选
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {jobs.map(job => (
                    <JobCard
                      key={job._id}
                      job={job}
                      onClick={() => navigate(`/jobs/${job._id}`)}
                    />
                  ))}
                </div>

                {/* 分页 */}
                {pagination.total_pages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="p-2 rounded-lg border border-[rgba(255,255,255,0.08)] text-[#94A3B8] hover:text-white hover:border-[rgba(255,255,255,0.2)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: Math.min(7, pagination.total_pages) }, (_, i) => {
                      let p: number;
                      if (pagination.total_pages <= 7) p = i + 1;
                      else if (page <= 4) p = i + 1;
                      else if (page >= pagination.total_pages - 3) p = pagination.total_pages - 6 + i;
                      else p = page - 3 + i;
                      return (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                            p === page
                              ? 'bg-gradient-to-r from-energy-cyan to-crystal-blue text-white'
                              : 'border border-[rgba(255,255,255,0.08)] text-[#94A3B8] hover:text-white hover:border-[rgba(255,255,255,0.2)]'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setPage(p => Math.min(pagination.total_pages, p + 1))}
                      disabled={page >= pagination.total_pages}
                      className="p-2 rounded-lg border border-[rgba(255,255,255,0.08)] text-[#94A3B8] hover:text-white hover:border-[rgba(255,255,255,0.2)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* 右侧：统计面板（桌面端） */}
          {!loading && filterStats.total > 0 && (
            <div className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-[140px] space-y-4">
                <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] p-5">
                  <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-energy-cyan" />
                    当前筛选统计
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#94A3B8]">符合岗位</span>
                      <span className="text-sm font-semibold text-white">{filterStats.total} 个</span>
                    </div>
                    {filterStats.avg_salary > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#94A3B8]">平均薪资</span>
                        <span className="text-sm font-semibold text-green-400">
                          {formatSalaryNum(filterStats.avg_salary)}/月
                        </span>
                      </div>
                    )}
                    {filterStats.median_salary > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#94A3B8]">薪资中位数</span>
                        <span className="text-sm font-semibold text-emerald-400">
                          {formatSalaryNum(filterStats.median_salary)}/月
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] p-5">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                    快速筛选
                  </h3>
                  <div className="space-y-2">
                    {['实习', '应届', '工业园区', '姑苏区'].map(tag => (
                      <button
                        key={tag}
                        onClick={() => {
                          if (['实习'].includes(tag)) { setJobType(tag); setPage(1); }
                          else if (['应届'].includes(tag)) { setSelectedExperience(tag); setPage(1); }
                          else { toggleMulti(tag, selectedDistricts, setSelectedDistricts); }
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs text-[#94A3B8] hover:text-energy-cyan hover:bg-[rgba(0,212,255,0.05)] transition-all flex items-center justify-between"
                      >
                        <span>{tag}</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
