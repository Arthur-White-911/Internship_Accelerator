const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// ─── 培养方案数据（与前端 mapApiProgram 字段完全对齐）────────────────────────
// 前端 mapApiProgram 读取：id / level / price / duration / description / features / image
// level 值必须为 '初级' / '中级' / '高级'，前端据此映射 tier / badgeColor / ctaColor 等
const PROGRAMS = [
  {
    id: 1,
    level: '初级',
    name: '入门加速方案',
    price: 99,
    duration: '1个月',
    image: '/program-starter.png',
    description: '适合刚开始准备实习的同学。通过系统的职业规划指导和基础技能培训，帮助你快速建立求职竞争力，拿到第一份实习 offer。',
    features: [
      '职业方向测评与规划指导',
      '基础技能培训（录播课程）',
      '简历模板库 + 1对1精修 x1',
      '面试题库 + AI模拟面试 x2次',
      '社群答疑 + 基础岗位推送',
    ],
    // 详情页扩展字段
    highlights: ['职业规划', '基础技能', '简历制作', '模拟面试'],
    mentor: '前阿里产品总监 · 5年以上实战经验',
    enrolled: 1280,
    rating: 4.8,
    tags: ['入门友好', '高频推荐', '全方向'],
    modules: [
      { week: 1, title: '职业方向诊断', content: '能力测评、行业认知、岗位匹配分析' },
      { week: 2, title: '简历打磨', content: '简历结构、量化成果、ATS优化' },
      { week: 3, title: '基础技能培训', content: '根据方向定制：产品/数据/运营/技术基础' },
      { week: 4, title: '求职材料准备', content: '求职信撰写、作品集整理、网申技巧' },
      { week: 5, title: '面试基础训练', content: '自我介绍、行为面试STAR法则、常见HR题' },
      { week: 6, title: 'AI模拟面试', content: '模拟面试 x2、反馈报告、针对性改进' },
      { week: 7, title: '求职渠道与投递', content: '内推渠道整理、投递策略、时间规划' },
      { week: 8, title: '冲刺与复盘', content: '面试复盘、offer评估、入职准备' },
    ],
  },
  {
    id: 2,
    level: '中级',
    name: '进阶提升方案',
    price: 199,
    duration: '1个月',
    image: '/program-advanced.png',
    description: '适合有一定基础、希望进入头部企业的同学。提供更深入的专业技能培训、导师1对1指导和多次模拟面试，显著提升竞争力。',
    features: [
      '职业规划 + 深度能力分析报告',
      '专业技能培训（录播 + 直播）',
      '简历1对1精修 x2 + 作品集指导',
      'AI模拟面试 x4次 + 详细反馈报告',
      '导师线上1对1指导 x4次',
      '行业报告 + 优先岗位推送',
    ],
    highlights: ['深度培训', '导师指导', '多次面试', '行业资源'],
    mentor: '前字节跳动高级工程师 · 8年以上经验',
    enrolled: 960,
    rating: 4.9,
    tags: ['最受欢迎', '大厂方向', '性价比高'],
    modules: [
      { week: 1, title: '深度职业诊断', content: '多维能力测评、行业趋势分析、个性化路径规划' },
      { week: 2, title: '专业技能强化', content: '根据方向定制：产品/数据/开发/运营进阶课程' },
      { week: 3, title: '项目经验打磨', content: '项目复盘、亮点提炼、量化成果表达' },
      { week: 4, title: '简历与作品集', content: '导师1对1精修简历、作品集结构优化' },
      { week: 5, title: '行业认知提升', content: '行业报告解读、竞品分析、商业思维培养' },
      { week: 6, title: '面试系统训练', content: '技术面试/案例面试专项训练' },
      { week: 7, title: 'AI模拟面试 x3', content: '全流程模拟、导师点评、薄弱项专项突破' },
      { week: 8, title: '导师1对1辅导', content: '职业规划深度沟通、面试策略定制' },
      { week: 9, title: '求职冲刺', content: '批量投递、面试跟进、谈薪技巧' },
      { week: 10, title: 'AI模拟面试 x2 + 复盘', content: '终极模拟、offer对比分析、入职准备' },
    ],
  },
  {
    id: 3,
    level: '高级',
    name: '专家直通方案',
    price: 299,
    duration: '1个月',
    image: '/program-expert.png',
    description: '适合目标顶尖企业、追求最佳保障的同学。全程1对1导师陪跑、企业内推资源、实习保障协议，助你拿到心仪的顶级实习 offer。',
    features: [
      '全程1对1导师陪跑 x4次',
      '深度能力分析 + 个性化培养计划',
      '专业技能培训（录播 + 直播 + 实战）',
      '简历1对1精修 x4次 + 作品集',
      'AI + 真人模拟面试 x4次',
      '企业实习内推 + 专属岗位推送',
      '项目实战 + 行业报告',
      '实习保障协议（未获offer全额退款）',
    ],
    highlights: ['全程陪跑', '企业内推', '实习保障', '顶级资源'],
    mentor: '前腾讯/阿里 P8级导师 · 10年以上经验',
    enrolled: 420,
    rating: 5.0,
    tags: ['最佳保障', '顶级资源', '内推直通'],
    modules: [
      { week: 1, title: '全面诊断与规划', content: '深度测评、导师首次1对1、个性化12个月培养计划制定' },
      { week: 2, title: '专业技能系统培训', content: '根据目标岗位定制高强度技能培训' },
      { week: 3, title: '项目实战', content: '参与真实项目或模拟项目，积累可写进简历的实战经验' },
      { week: 4, title: '简历与作品集精修', content: '导师反复打磨，确保简历通过率最大化' },
      { week: 5, title: '行业深度研究', content: '目标行业深度报告、竞争对手分析、岗位JD拆解' },
      { week: 6, title: '面试全类型训练', content: 'HR面/技术面/案例面/群面全覆盖' },
      { week: 7, title: '真人模拟面试 x3', content: '导师1对1模拟，还原真实面试场景' },
      { week: 8, title: '内推资源对接', content: '匹配企业内推资源，优先获得面试机会' },
      { week: 9, title: '高频面试冲刺', content: '每日面试跟进、实时反馈、快速迭代' },
      { week: 10, title: '真人模拟面试 x2', content: '终极压力测试，模拟最终面场景' },
      { week: 11, title: 'Offer谈判与决策', content: '薪资谈判策略、多offer对比分析' },
      { week: 12, title: '入职准备', content: '入职前技能查漏补缺、职场生存指南' },
    ],
  },
];

// ─── DeepSeek AI 调用工具函数 ─────────────────────────────────────────────────
async function callDeepSeek(messages, options = {}) {
  const deepseekKey = process.env.DEEPSEEK_API_KEY || 'sk-2b401ab6175e449ea8087884eb78e423';
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${deepseekKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      max_tokens: options.max_tokens || 1000,
      temperature: options.temperature || 0.6,
      response_format: options.json_mode ? { type: 'json_object' } : undefined,
    }),
  });
  const data = await response.json();
  if (!data.choices || !data.choices[0]) {
    throw new Error('DeepSeek 接口返回异常');
  }
  return data.choices[0].message.content;
}

// ─── GET /api/programs ────────────────────────────────────────────────────────
// 返回方案列表（不含 modules 详情），无需登录
router.get('/', async (req, res) => {
  try {
    const list = PROGRAMS.map(({ modules, highlights, mentor, enrolled, rating, tags, ...p }) => p);
    return res.json({ success: true, data: list });
  } catch (err) {
    console.error('[programs list]', err);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// ─── GET /api/programs/my/enrollments ────────────────────────────────────────
// 必须在 /:id 之前注册，避免 'my' 被当作 id
router.get('/my/enrollments', authMiddleware, async (req, res) => {
  try {
    const enrollments = await db.enrollments.findAsync({ userId: req.userId });
    enrollments.sort((a, b) => new Date(b.enrolledAt) - new Date(a.enrolledAt));

    const result = enrollments.map(e => {
      const program = PROGRAMS.find(p => p.id === e.programId);
      return {
        ...e,
        program: program
          ? {
              id: program.id,
              level: program.level,
              name: program.name,
              price: program.price,
              duration: program.duration,
              features: program.features,
              image: program.image,
            }
          : null,
      };
    });

    return res.json({ success: true, data: result });
  } catch (err) {
    console.error('[my enrollments]', err);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// ─── GET /api/programs/:id ────────────────────────────────────────────────────
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const program = PROGRAMS.find(p => p.id === parseInt(req.params.id));
    if (!program) return res.status(404).json({ success: false, message: '方案不存在' });

    // 检查当前用户是否已报名
    const enrollment = await db.enrollments.findOneAsync({
      userId: req.userId,
      programId: program.id,
    });

    return res.json({
      success: true,
      data: { ...program, enrolled_by_user: !!enrollment, enrollment: enrollment || null },
    });
  } catch (err) {
    console.error('[program detail]', err);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// ─── POST /api/programs/:id/enroll ───────────────────────────────────────────
router.post('/:id/enroll', authMiddleware, async (req, res) => {
  try {
    const programId = parseInt(req.params.id);
    const program = PROGRAMS.find(p => p.id === programId);
    if (!program) return res.status(404).json({ success: false, message: '方案不存在' });

    // 防止重复报名
    const existing = await db.enrollments.findOneAsync({ userId: req.userId, programId });
    if (existing) {
      return res.status(400).json({ success: false, message: '你已报名该方案，无需重复报名' });
    }

    // ── 获取用户画像，用于 AI 生成个性化学习路径 ──────────────────────────
    let learningPath = null;
    try {
      const user = await db.users.findOneAsync({ _id: req.userId });
      const latestAssessment = await db.assessments
        .findAsync({ userId: req.userId })
        .then(list => list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] || null);

      const userProfile = {
        major: user?.major || '未填写',
        skillLevel: latestAssessment?.skillLevel || user?.skillProfessional || '初级',
        careerGoal: latestAssessment?.careerGoal || '互联网实习',
        matchPercent: latestAssessment?.matchPercent || 60,
      };

      const systemPrompt = `你是一位专业的职业培训顾问，擅长为大学生制定个性化的学习计划。
请根据学生的背景信息和所选培养方案，生成一份简洁、可执行的个性化学习路径建议。
严格按照要求的 JSON 格式输出，不要输出任何 JSON 以外的内容。`;

      const userPrompt = `请为以下学生生成个性化学习路径建议。

【学生背景】
- 专业：${userProfile.major}
- 当前技能水平：${userProfile.skillLevel}
- 求职目标：${userProfile.careerGoal}
- 能力测评匹配度：${userProfile.matchPercent}分

【所选方案】
- 方案名称：${program.name}（${program.level}）
- 培训时长：${program.duration}
- 核心内容：${program.features.join('、')}

【输出要求】
请生成3条针对该学生的个性化建议，每条建议要结合其专业背景和求职目标，具体可执行。
同时给出一个重点关注方向（focusArea）和预期成果（expectedOutcome）。

【输出格式】（严格遵守，仅输出 JSON）
{
  "focusArea": "<根据学生背景推荐的重点关注方向>",
  "expectedOutcome": "<完成该方案后的预期成果>",
  "personalizedTips": [
    "<个性化建议1>",
    "<个性化建议2>",
    "<个性化建议3>"
  ]
}`;

      const rawContent = await callDeepSeek(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        { max_tokens: 800, temperature: 0.6, json_mode: true }
      );

      const parsed = JSON.parse(rawContent);
      learningPath = {
        focusArea: parsed.focusArea || `${program.level}核心技能强化`,
        expectedOutcome: parsed.expectedOutcome || `完成${program.name}全部训练，具备${program.level}岗位竞争力`,
        personalizedTips: Array.isArray(parsed.personalizedTips) && parsed.personalizedTips.length > 0
          ? parsed.personalizedTips.slice(0, 3).map(s => String(s))
          : ['建议结合自身专业背景，重点突破求职目标岗位的核心技能。'],
      };
    } catch (aiErr) {
      console.error('[programs enroll AI error]', aiErr.message);
      // AI 失败时使用默认学习路径
      learningPath = {
        focusArea: `${program.level}核心技能强化`,
        expectedOutcome: `完成${program.name}全部训练，具备${program.level}岗位竞争力`,
        personalizedTips: [
          '建议优先完成职业方向测评，明确求职目标后再制定学习计划。',
          '每周保持稳定的学习时间投入，循序渐进地完成各阶段任务。',
          '积极参与模拟面试练习，将所学技能转化为面试竞争力。',
        ],
      };
    }

    // ── 写入报名记录 ──────────────────────────────────────────────────────
    const enrollment = await db.enrollments.insertAsync({
      userId: req.userId,
      programId,
      programLevel: program.level,
      programName: program.name,
      progress: 0,
      currentWeek: 1,
      status: 'active',
      learningPath,
      enrolledAt: new Date().toISOString(),
    });

    // ── 写入报名成功通知 ──────────────────────────────────────────────────
    await db.notifications.insertAsync({
      userId: req.userId,
      type: 'program',
      title: `🎉 成功报名「${program.name}」`,
      content: `你已成功报名${program.level}培养方案（${program.name}），学习周期 ${program.duration}。${learningPath.focusArea ? `本方案将重点帮助你强化「${learningPath.focusArea}」。` : ''}快去开始你的加速之旅吧！`,
      isRead: false,
      actionType: 'navigate',
      actionData: '/programs',
      createdAt: new Date().toISOString(),
    });

    return res.json({
      success: true,
      message: `成功报名「${program.name}」！`,
      data: {
        programId,
        programLevel: program.level,
        programName: program.name,
        learningPath,
        enrolledAt: enrollment.enrolledAt,
      },
    });
  } catch (err) {
    console.error('[programs enroll]', err);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
