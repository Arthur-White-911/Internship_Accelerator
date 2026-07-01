const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// ─── 工具函数 ──────────────────────────────────────────────────────────────

// 薪资文本解析为数值（元/月）
function parseSalary(text) {
  if (!text) return { min: null, max: null };
  const t = text.replace(/\s/g, '');
  // 匹配 "10K-15K" / "10k-15k" 格式
  const kRange = t.match(/(\d+(?:\.\d+)?)K?k?[-~](\d+(?:\.\d+)?)K?k?/i);
  if (kRange) {
    const isK = /k/i.test(t);
    const mul = isK ? 1000 : 1;
    return {
      min: Math.round(parseFloat(kRange[1]) * mul),
      max: Math.round(parseFloat(kRange[2]) * mul),
    };
  }
  // 匹配单个数值 "15K"
  const single = t.match(/(\d+(?:\.\d+)?)K?k?/i);
  if (single) {
    const isK = /k/i.test(t);
    const val = Math.round(parseFloat(single[1]) * (isK ? 1000 : 1));
    return { min: val, max: val };
  }
  return { min: null, max: null };
}

// 地区标准化映射
const DISTRICT_MAP = {
  '姑苏': '姑苏区', '虎丘': '虎丘区', '高新区': '虎丘区',
  '吴中': '吴中区', '相城': '相城区', '园区': '工业园区',
  '工业园': '工业园区', '吴江': '吴江区', '常熟': '常熟市',
  '张家港': '张家港市', '昆山': '昆山市', '太仓': '太仓市',
};
const VALID_DISTRICTS = ['姑苏区','虎丘区','吴中区','相城区','工业园区','吴江区','常熟市','张家港市','昆山市','太仓市'];

function normalizeDistrict(raw) {
  if (!raw) return '其他';
  if (VALID_DISTRICTS.includes(raw)) return raw;
  for (const [key, val] of Object.entries(DISTRICT_MAP)) {
    if (raw.includes(key)) return val;
  }
  return '其他';
}

// 构建 NeDB 查询条件
function buildQuery(params) {
  const query = {};
  const { district, category, education, experience, salary_min, salary_max,
          job_type, source_platform, date, keyword } = params;

  if (district) {
    const districts = Array.isArray(district) ? district : [district];
    if (!districts.includes('苏州全市')) query.district = { $in: districts };
  }
  if (category) {
    const cats = Array.isArray(category) ? category : [category];
    query.category = { $in: cats };
  }
  if (education) {
    const edus = Array.isArray(education) ? education : [education];
    if (!edus.includes('不限')) query.education = { $in: edus };
  }
  if (experience && experience !== '不限') {
    query.experience = experience;
  }
  if (job_type) query.job_type = job_type;
  if (source_platform) query.source_platform = source_platform;

  // 薪资区间
  if (salary_min || salary_max) {
    if (salary_min) query.salary_max = { $gte: Number(salary_min) };
    if (salary_max) query.salary_min = { ...(query.salary_min || {}), $lte: Number(salary_max) };
  }

  // 日期筛选
  if (date) {
    query.publish_date = date;
  }

  // 关键词搜索（标题 + 公司名）
  if (keyword) {
    const reg = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [{ title: reg }, { company: reg }];
  }

  return query;
}

// ─── POST /api/jobs/batch ─── 定时任务批量写入（无需登录，内部调用）──────────
router.post('/batch', async (req, res) => {
  try {
    const { jobs, scrape_date, source_summary } = req.body;
    if (!Array.isArray(jobs) || jobs.length === 0) {
      return res.status(400).json({ success: false, message: 'jobs 数组不能为空' });
    }

    const today = scrape_date || new Date().toISOString().slice(0, 10);
    let inserted = 0;
    let skipped = 0;
    const errors = [];

    for (const job of jobs) {
      try {
        // 解析薪资
        const { min: salary_min, max: salary_max } = parseSalary(job.salary_text);
        // 标准化地区
        const district = normalizeDistrict(job.district);

        const doc = {
          title: (job.title || '').trim(),
          company: (job.company || '').trim(),
          salary_min,
          salary_max,
          salary_text: job.salary_text || '薪资面议',
          district,
          address: job.address || '',
          experience: job.experience || '不限',
          education: job.education || '不限',
          category: job.category || '其他',
          job_type: job.job_type || '全职',
          publish_date: job.publish_date || today,
          source_url: job.source_url || '',
          source_platform: job.source_platform || '未知',
          description: (job.description || '').slice(0, 500),
          tags: Array.isArray(job.tags) ? job.tags : [],
          company_size: job.company_size || '',
          company_type: job.company_type || '',
          created_at: new Date().toISOString(),
        };

        if (!doc.title || !doc.company) { skipped++; continue; }

        // 去重：同公司+同职位+同日期
        const existing = await db.jobs.findOneAsync({
          company: doc.company,
          title: doc.title,
          publish_date: doc.publish_date,
        });

        if (existing) { skipped++; continue; }

        await db.jobs.insertAsync(doc);
        inserted++;
      } catch (e) {
        errors.push(e.message);
        skipped++;
      }
    }

    return res.json({
      success: true,
      data: {
        inserted,
        skipped,
        total: jobs.length,
        scrape_date: today,
        source_summary: source_summary || {},
        errors: errors.slice(0, 10),
      },
    });
  } catch (err) {
    console.error('[jobs batch]', err);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// ─── GET /api/jobs/stats ─── 统计数据（首页看板）────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const allJobs = await db.jobs.findAsync({});

    const todayJobs = allJobs.filter(j => j.publish_date === today);
    const totalJobs = allJobs.length;

    // 今日新增
    const todayCount = todayJobs.length;

    // 在招企业数（去重）
    const companies = new Set(allJobs.map(j => j.company));

    // 分类统计 Top 8
    const catMap = {};
    allJobs.forEach(j => {
      if (j.category) catMap[j.category] = (catMap[j.category] || 0) + 1;
    });
    const topCategories = Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));

    // 地区分布
    const districtMap = {};
    allJobs.forEach(j => {
      if (j.district) districtMap[j.district] = (districtMap[j.district] || 0) + 1;
    });
    const districtStats = Object.entries(districtMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));

    // 薪资分布（有明确薪资的岗位）
    const salaryBuckets = [
      { label: '5K以下', min: 0, max: 5000, count: 0 },
      { label: '5K-10K', min: 5000, max: 10000, count: 0 },
      { label: '10K-15K', min: 10000, max: 15000, count: 0 },
      { label: '15K-20K', min: 15000, max: 20000, count: 0 },
      { label: '20K-30K', min: 20000, max: 30000, count: 0 },
      { label: '30K以上', min: 30000, max: Infinity, count: 0 },
    ];
    let salarySum = 0, salaryCount = 0;
    allJobs.forEach(j => {
      if (j.salary_min != null && j.salary_min > 0) {
        const mid = j.salary_max ? (j.salary_min + j.salary_max) / 2 : j.salary_min;
        salarySum += mid;
        salaryCount++;
        const bucket = salaryBuckets.find(b => mid >= b.min && mid < b.max);
        if (bucket) bucket.count++;
      }
    });

    // 最高薪资 Top 3
    const topSalaryJobs = allJobs
      .filter(j => j.salary_max != null && j.salary_max > 0)
      .sort((a, b) => b.salary_max - a.salary_max)
      .slice(0, 3)
      .map(j => ({
        _id: j._id,
        title: j.title,
        company: j.company,
        salary_text: j.salary_text,
        district: j.district,
      }));

    // 最新更新时间
    const latestJob = allJobs.sort((a, b) =>
      new Date(b.created_at) - new Date(a.created_at)
    )[0];

    return res.json({
      success: true,
      data: {
        today_count: todayCount,
        total_count: totalJobs,
        company_count: companies.size,
        avg_salary: salaryCount > 0 ? Math.round(salarySum / salaryCount) : 0,
        top_categories: topCategories,
        district_stats: districtStats,
        salary_distribution: salaryBuckets.map(b => ({ label: b.label, count: b.count })),
        top_salary_jobs: topSalaryJobs,
        last_updated: latestJob ? latestJob.created_at : null,
      },
    });
  } catch (err) {
    console.error('[jobs stats]', err);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// ─── GET /api/jobs/filters ─── 获取筛选选项（动态）────────────────────────
router.get('/filters', async (req, res) => {
  try {
    const allJobs = await db.jobs.findAsync({});
    const categories = [...new Set(allJobs.map(j => j.category).filter(Boolean))].sort();
    const platforms = [...new Set(allJobs.map(j => j.source_platform).filter(Boolean))].sort();

    return res.json({
      success: true,
      data: {
        districts: ['苏州全市','姑苏区','虎丘区','吴中区','相城区','工业园区','吴江区','常熟市','张家港市','昆山市','太仓市'],
        categories,
        educations: ['不限','大专','本科','硕士','博士'],
        experiences: ['不限','应届','1年以内','1-3年','3-5年','5-10年','10年以上'],
        job_types: ['全职','兼职','实习'],
        source_platforms: platforms,
        sort_options: [
          { value: 'date_desc', label: '最新发布' },
          { value: 'salary_desc', label: '薪资从高到低' },
          { value: 'salary_asc', label: '薪资从低到高' },
        ],
      },
    });
  } catch (err) {
    console.error('[jobs filters]', err);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// ─── GET /api/jobs ─── 岗位列表（分页 + 多条件筛选）────────────────────────
router.get('/', async (req, res) => {
  try {
    const {
      page = 1, limit = 20, sort = 'date_desc',
      district, category, education, experience,
      salary_min, salary_max, job_type, source_platform,
      date, keyword,
    } = req.query;

    const query = buildQuery({
      district, category, education, experience,
      salary_min, salary_max, job_type, source_platform,
      date, keyword,
    });

    const allMatched = await db.jobs.findAsync(query);

    // 排序
    allMatched.sort((a, b) => {
      if (sort === 'salary_desc') {
        return (b.salary_max || b.salary_min || 0) - (a.salary_max || a.salary_min || 0);
      }
      if (sort === 'salary_asc') {
        const aMin = a.salary_min || 999999;
        const bMin = b.salary_min || 999999;
        return aMin - bMin;
      }
      // 默认：最新发布
      return new Date(b.publish_date) - new Date(a.publish_date) ||
             new Date(b.created_at) - new Date(a.created_at);
    });

    const total = allMatched.length;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const start = (pageNum - 1) * limitNum;
    const items = allMatched.slice(start, start + limitNum);

    // 当前筛选结果的统计（用于列表页右侧面板）
    const validSalaryJobs = allMatched.filter(j => j.salary_min != null && j.salary_min > 0);
    const avgSalary = validSalaryJobs.length > 0
      ? Math.round(validSalaryJobs.reduce((s, j) => {
          const mid = j.salary_max ? (j.salary_min + j.salary_max) / 2 : j.salary_min;
          return s + mid;
        }, 0) / validSalaryJobs.length)
      : 0;

    const sortedSalaries = validSalaryJobs
      .map(j => j.salary_max ? (j.salary_min + j.salary_max) / 2 : j.salary_min)
      .sort((a, b) => a - b);
    const medianSalary = sortedSalaries.length > 0
      ? sortedSalaries[Math.floor(sortedSalaries.length / 2)]
      : 0;

    return res.json({
      success: true,
      data: {
        items,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          total_pages: Math.ceil(total / limitNum),
        },
        filter_stats: {
          total,
          avg_salary: avgSalary,
          median_salary: Math.round(medianSalary),
        },
      },
    });
  } catch (err) {
    console.error('[jobs list]', err);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// ─── GET /api/jobs/:id ─── 岗位详情────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const job = await db.jobs.findOneAsync({ _id: req.params.id });
    if (!job) {
      return res.status(404).json({ success: false, message: '岗位不存在或已下线' });
    }
    return res.json({ success: true, data: job });
  } catch (err) {
    console.error('[jobs detail]', err);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
