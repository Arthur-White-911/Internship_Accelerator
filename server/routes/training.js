const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// 内置培训项目数据
const TRAINING_PROJECTS = [
  {
    id: 1,
    category: 'softskill',
    title: '简历一对一诊断',
    description: '由资深HR对你的简历进行全面诊断，指出问题并给出修改建议，帮你打造一份通过率更高的简历。',
    duration: '1小时',
    format: '一对一',
    difficulty: '初级',
    tags: ['简历', '求职', '高频'],
    outcomes: ['了解简历筛选标准', '掌握简历优化技巧', '获得定制化修改建议'],
  },
  {
    id: 2,
    category: 'softskill',
    title: 'STAR法则面试训练',
    description: '通过STAR法则（情境、任务、行动、结果）系统训练行为面试回答技巧，让你的面试回答更有说服力。',
    duration: '2小时',
    format: '小组',
    difficulty: '初级',
    tags: ['面试', '行为面试', '通用'],
    outcomes: ['掌握STAR法则', '学会结构化表达', '提升面试自信心'],
  },
  {
    id: 3,
    category: 'softskill',
    title: '职业方向探索工作坊',
    description: '通过职业测评、行业分析和导师引导，帮助你找到最适合自己的职业方向，制定清晰的求职路径。',
    duration: '3小时',
    format: '工作坊',
    difficulty: '初级',
    tags: ['职业规划', '方向选择', '大一大二'],
    outcomes: ['明确职业兴趣', '了解目标行业', '制定求职计划'],
  },
  {
    id: 4,
    category: 'skill',
    title: 'Excel数据分析实战',
    description: '从基础函数到透视表、图表制作，掌握职场必备的Excel数据分析技能，适合零基础学员。',
    duration: '4小时',
    format: '在线课程',
    difficulty: '初级',
    tags: ['Excel', '数据分析', '职场技能'],
    outcomes: ['掌握常用函数', '学会数据透视表', '制作专业图表'],
  },
  {
    id: 5,
    category: 'skill',
    title: 'Python数据分析入门',
    description: '从Python基础语法到Pandas数据处理，结合真实业务数据集进行实战练习，建立数据分析思维。',
    duration: '8小时',
    format: '在线课程',
    difficulty: '中级',
    tags: ['Python', '数据分析', '技术'],
    outcomes: ['Python基础语法', 'Pandas数据处理', '数据可视化'],
  },
  {
    id: 6,
    category: 'skill',
    title: '大厂模拟面试（技术岗）',
    description: '由前BAT技术面试官进行1v1模拟面试，覆盖算法、系统设计、项目经验三大模块，提供详细反馈报告。',
    duration: '1.5小时',
    format: '一对一',
    difficulty: '中级',
    tags: ['模拟面试', '技术', '大厂'],
    outcomes: ['了解大厂面试标准', '发现自身薄弱点', '获得针对性提升建议'],
  },
  {
    id: 7,
    category: 'softskill',
    title: '薪资谈判技巧训练',
    description: '学习薪资谈判的核心策略和话术，了解市场薪资水平，帮你在offer阶段争取到更好的薪资待遇。',
    duration: '1.5小时',
    format: '小组',
    difficulty: '中级',
    tags: ['薪资谈判', 'offer', '求职'],
    outcomes: ['了解薪资市场行情', '掌握谈判策略', '提升薪资期望值'],
  },
  {
    id: 8,
    category: 'language',
    title: '英文简历写作工作坊',
    description: '针对外资企业和跨国公司的英文简历写作技巧，包括格式规范、关键词优化、自我介绍信撰写。',
    duration: '2小时',
    format: '工作坊',
    difficulty: '中级',
    tags: ['英文简历', '外资', '英语'],
    outcomes: ['掌握英文简历格式', '学会关键词优化', '撰写Cover Letter'],
  },
];

// GET /api/training/projects
router.get('/projects', authMiddleware, async (req, res) => {
  try {
    const { category } = req.query;
    let projects = [...TRAINING_PROJECTS];
    if (category) projects = projects.filter(p => p.category === category);
    return res.json({ success: true, data: projects });
  } catch (err) {
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// GET /api/training/projects/:id
router.get('/projects/:id', authMiddleware, async (req, res) => {
  try {
    const project = TRAINING_PROJECTS.find(p => p.id === parseInt(req.params.id));
    if (!project) return res.status(404).json({ success: false, message: '项目不存在' });
    return res.json({ success: true, data: project });
  } catch (err) {
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// POST /api/training/start
router.post('/start', authMiddleware, async (req, res) => {
  try {
    const { projectId, topic, content, duration } = req.body;
    if (!projectId || !topic || !duration) {
      return res.status(400).json({ success: false, message: '请填写完整信息' });
    }
    const project = TRAINING_PROJECTS.find(p => p.id === parseInt(projectId));
    if (!project) return res.status(404).json({ success: false, message: '项目不存在' });

    const session = await db.trainingSessions.insertAsync({
      userId: req.userId,
      projectId: parseInt(projectId),
      projectTitle: project.title,
      topic,
      content: content || '',
      duration,
      status: 'scheduled',
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 明天
      createdAt: new Date().toISOString(),
    });

    // 根据项目类型生成训练建议，供前端 AI 训练建议面板展示
    const suggestionMap = {
      softskill: [
        `专注于「${project.title}」的核心要点，结合真实场景反复练习。`,
        '训练前先梳理自己的薄弱点，有针对性地突破。',
        '完成后及时复盘，记录收获与改进方向。',
      ],
      skill: [
        `「${project.title}」是高频考察技能，建议结合实际项目巩固。`,
        '遇到不懂的概念立即查阅文档，养成主动学习的习惯。',
        '训练结束后尝试用自己的话总结核心知识点。',
      ],
      language: [
        `语言训练贵在坚持，建议每天保持「${duration}分钟」的训练节奏。`,
        '多进行输出练习（口说/写作），而不仅仅是被动输入。',
        '遇到好的表达方式及时记录，形成自己的素材库。',
      ],
    };
    const suggestions = suggestionMap[project.category] || [
      `认真完成「${project.title}」的训练内容，注重实践与总结。`,
      '保持专注，避免分心，提升单位时间的训练效率。',
      '训练结束后与同学或导师交流，获取外部反馈。',
    ];

    return res.json({
      success: true,
      message: '训练计划已开始',
      data: { ...session, suggestions },
    });
  } catch (err) {
    console.error('[training start]', err);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// GET /api/training/sessions
router.get('/sessions', authMiddleware, async (req, res) => {
  try {
    const sessions = await db.trainingSessions.findAsync({ userId: req.userId });
    sessions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.json({ success: true, data: sessions });
  } catch (err) {
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// GET /api/training/progress
router.get('/progress', authMiddleware, async (req, res) => {
  try {
    const sessions = await db.trainingSessions.findAsync({ userId: req.userId });

    // 统计各分类的完成数量
    const categoryCount = { skill: 0, language: 0, softskill: 0 };
    const categoryTotal = { skill: 0, language: 0, softskill: 0 };

    sessions.forEach(s => {
      const project = TRAINING_PROJECTS.find(p => p.id === s.projectId);
      if (project && project.category in categoryTotal) {
        categoryTotal[project.category] += 1;
        if (s.status === 'completed') {
          categoryCount[project.category] += 1;
        }
      }
    });

    // 前端期望数组格式: [{ category, percent }]
    const data = Object.keys(categoryTotal)
      .filter(cat => categoryTotal[cat] > 0)
      .map(cat => ({
        category: cat,
        percent: Math.round((categoryCount[cat] / categoryTotal[cat]) * 100),
      }));

    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
