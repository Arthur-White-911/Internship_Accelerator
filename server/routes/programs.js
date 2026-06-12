const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// 内置培养方案数据
const PROGRAMS = [
  {
    id: 1,
    title: '互联网产品经理实习直通车',
    category: '产品',
    duration: '8周',
    level: '入门',
    description: '从零开始系统学习产品经理核心技能，包括需求分析、原型设计、数据分析、项目管理，配合真实项目实战，助你拿到互联网PM实习offer。',
    highlights: ['需求文档撰写', 'Axure原型设计', '数据分析基础', 'B端/C端产品思维'],
    mentor: '前阿里产品总监',
    enrolled: 1280,
    rating: 4.8,
    tags: ['产品', '互联网', '高频推荐'],
    modules: [
      { week: 1, title: '产品思维与用户研究', content: '用户画像、需求挖掘、竞品分析' },
      { week: 2, title: '需求文档与原型设计', content: 'PRD撰写规范、Axure实战' },
      { week: 3, title: '数据分析基础', content: 'SQL入门、数据指标体系、A/B测试' },
      { week: 4, title: '项目管理实战', content: '敏捷开发、Jira使用、跨部门协作' },
      { week: 5, title: '案例拆解：头部产品', content: '微信、抖音、美团产品架构分析' },
      { week: 6, title: '简历与作品集打磨', content: '产品经理简历模板、作品集制作' },
      { week: 7, title: '模拟面试训练', content: '高频面试题、产品sense考察' },
      { week: 8, title: '求职冲刺', content: '内推渠道、投递策略、offer谈判' },
    ],
  },
  {
    id: 2,
    title: '数据分析师实习加速营',
    category: '数据',
    duration: '6周',
    level: '入门',
    description: '掌握数据分析全流程，从Excel到Python，从描述性统计到机器学习基础，结合业务场景实战，快速具备数据分析岗位竞争力。',
    highlights: ['Python数据分析', 'SQL进阶', '可视化工具', '业务分析思维'],
    mentor: '前字节数据科学家',
    enrolled: 960,
    rating: 4.7,
    tags: ['数据', '技术', '高薪方向'],
    modules: [
      { week: 1, title: 'Excel与数据基础', content: '数据清洗、透视表、函数应用' },
      { week: 2, title: 'SQL实战', content: '多表联查、窗口函数、性能优化' },
      { week: 3, title: 'Python数据分析', content: 'Pandas、Numpy、Matplotlib' },
      { week: 4, title: '统计学基础', content: '假设检验、相关分析、回归分析' },
      { week: 5, title: '业务分析实战', content: '用户留存、漏斗分析、归因模型' },
      { week: 6, title: '求职冲刺', content: '数据分析面试题、笔试真题演练' },
    ],
  },
  {
    id: 3,
    title: '前端开发实习突破营',
    category: '技术',
    duration: '10周',
    level: '进阶',
    description: '系统掌握现代前端开发技术栈（React/Vue + TypeScript），通过真实项目实战提升工程能力，助你进入一线互联网公司前端团队。',
    highlights: ['React/Vue框架', 'TypeScript', '工程化实践', '性能优化'],
    mentor: '前腾讯高级前端工程师',
    enrolled: 750,
    rating: 4.9,
    tags: ['技术', '前端', '工程师'],
    modules: [
      { week: 1, title: 'HTML/CSS进阶', content: 'Flex/Grid布局、CSS动画、响应式设计' },
      { week: 2, title: 'JavaScript深入', content: '原型链、闭包、异步编程、ES6+' },
      { week: 3, title: 'TypeScript基础', content: '类型系统、接口、泛型' },
      { week: 4, title: 'React核心', content: 'Hooks、状态管理、组件设计' },
      { week: 5, title: 'Vue3实战', content: 'Composition API、Pinia、Vue Router' },
      { week: 6, title: '工程化实践', content: 'Vite、Webpack、CI/CD' },
      { week: 7, title: '性能优化', content: '懒加载、代码分割、Web Vitals' },
      { week: 8, title: '项目实战', content: '完整项目开发、代码Review' },
      { week: 9, title: '算法与数据结构', content: '前端高频算法题精讲' },
      { week: 10, title: '求职冲刺', content: '大厂面试流程、薪资谈判' },
    ],
  },
  {
    id: 4,
    title: '运营实习快速入门',
    category: '运营',
    duration: '6周',
    level: '入门',
    description: '覆盖内容运营、用户运营、活动运营三大方向，结合真实案例，快速建立运营思维体系，助你拿到互联网运营实习。',
    highlights: ['内容策划', '用户增长', '活动运营', '数据复盘'],
    mentor: '前网易运营总监',
    enrolled: 1100,
    rating: 4.6,
    tags: ['运营', '互联网', '入门友好'],
    modules: [
      { week: 1, title: '运营思维建立', content: '运营本质、核心指标、运营体系' },
      { week: 2, title: '内容运营', content: '选题策划、爆款文章、内容矩阵' },
      { week: 3, title: '用户运营', content: '用户分层、私域流量、社群运营' },
      { week: 4, title: '活动运营', content: '活动策划、执行流程、效果评估' },
      { week: 5, title: '数据分析与复盘', content: '运营数据看板、A/B测试、增长模型' },
      { week: 6, title: '求职冲刺', content: '运营面试题、作品集准备' },
    ],
  },
];

// GET /api/programs
router.get('/', authMiddleware, async (req, res) => {
  try {
    const list = PROGRAMS.map(({ modules, ...p }) => p);
    return res.json({ success: true, data: list });
  } catch (err) {
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// GET /api/programs/my/enrollments
router.get('/my/enrollments', authMiddleware, async (req, res) => {
  try {
    const enrollments = await db.enrollments.findAsync({ userId: req.userId });
    const result = enrollments.map(e => {
      const program = PROGRAMS.find(p => p.id === e.programId);
      return { ...e, program: program ? { id: program.id, title: program.title, category: program.category, duration: program.duration } : null };
    });
    return res.json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// GET /api/programs/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const program = PROGRAMS.find(p => p.id === parseInt(req.params.id));
    if (!program) return res.status(404).json({ success: false, message: '方案不存在' });
    // 检查是否已报名
    const enrollment = await db.enrollments.findOneAsync({ userId: req.userId, programId: program.id });
    return res.json({ success: true, data: { ...program, enrolled_by_user: !!enrollment } });
  } catch (err) {
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// POST /api/programs/:id/enroll
router.post('/:id/enroll', authMiddleware, async (req, res) => {
  try {
    const programId = parseInt(req.params.id);
    const program = PROGRAMS.find(p => p.id === programId);
    if (!program) return res.status(404).json({ success: false, message: '方案不存在' });
    const existing = await db.enrollments.findOneAsync({ userId: req.userId, programId });
    if (existing) return res.status(400).json({ success: false, message: '已报名该方案' });
    await db.enrollments.insertAsync({
      userId: req.userId,
      programId,
      progress: 0,
      currentWeek: 1,
      status: 'active',
      enrolledAt: new Date().toISOString(),
    });
    return res.json({ success: true, message: '报名成功' });
  } catch (err) {
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
