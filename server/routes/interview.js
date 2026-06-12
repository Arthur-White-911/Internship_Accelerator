const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// 内置面试题库
const QUESTIONS_BANK = [
  { id: 1, category: '行为面试', type: 'HR', frequency: '高频', question: '请介绍一下你自己', answer: '建议从学校背景、专业技能、实习经历、个人优势四个维度展开，控制在2分钟以内。', tags: ['自我介绍', '通用'] },
  { id: 2, category: '行为面试', type: 'HR', frequency: '高频', question: '你的优点和缺点是什么？', answer: '优点结合岗位需求，缺点选择可以改进的方向，并说明改进措施。', tags: ['自我认知', '通用'] },
  { id: 3, category: '行为面试', type: 'HR', frequency: '高频', question: '你为什么选择我们公司？', answer: '从公司文化、业务方向、成长空间三个角度回答，展示你做过充分调研。', tags: ['动机', '通用'] },
  { id: 4, category: '行为面试', type: 'HR', frequency: '高频', question: '你的职业规划是什么？', answer: '短期（1-2年）聚焦技能提升，中期（3-5年）聚焦专业深度，长期聚焦价值贡献。', tags: ['职业规划', '通用'] },
  { id: 5, category: '行为面试', type: 'HR', frequency: '中频', question: '描述一次你遇到困难并解决的经历', answer: '使用STAR法则：情境（Situation）、任务（Task）、行动（Action）、结果（Result）。', tags: ['问题解决', '通用'] },
  { id: 6, category: '行为面试', type: 'HR', frequency: '中频', question: '你如何处理工作中的压力？', answer: '举具体例子，说明你的压力管理方法，如拆解任务、优先级排序、寻求支持等。', tags: ['压力管理', '通用'] },
  { id: 7, category: '技术面试', type: '技术', frequency: '高频', question: '请介绍一下你做过的最有挑战性的项目', answer: '重点描述技术难点、你的解决思路、最终成果和学到的经验。', tags: ['项目经验', '技术'] },
  { id: 8, category: '技术面试', type: '技术', frequency: '高频', question: '你熟悉哪些编程语言和技术栈？', answer: '按熟练程度分层介绍，重点说明你最擅长的，并结合项目经验举例。', tags: ['技术能力', '技术'] },
  { id: 9, category: '技术面试', type: '技术', frequency: '中频', question: '如何保证代码质量？', answer: '从代码规范、单元测试、Code Review、持续集成等方面回答。', tags: ['工程实践', '技术'] },
  { id: 10, category: '技术面试', type: '技术', frequency: '中频', question: '你了解哪些设计模式？', answer: '介绍2-3个常用设计模式（如单例、工厂、观察者），并结合实际项目说明使用场景。', tags: ['设计模式', '技术'] },
  { id: 11, category: '情景面试', type: '经理', frequency: '高频', question: '如果你和同事意见不一致，你会怎么处理？', answer: '强调沟通、理解对方立场、寻找共同目标，必要时升级到上级决策。', tags: ['团队协作', '软技能'] },
  { id: 12, category: '情景面试', type: '经理', frequency: '高频', question: '如果你同时有多个紧急任务，你如何安排优先级？', answer: '使用四象限法则（紧急重要矩阵），与上级确认优先级，合理分配时间。', tags: ['时间管理', '软技能'] },
  { id: 13, category: '情景面试', type: '经理', frequency: '中频', question: '如果你发现同事的工作有错误，你会怎么做？', answer: '私下友好地指出，关注问题本身而非批评人，必要时提供帮助。', tags: ['团队协作', '软技能'] },
  { id: 14, category: '行为面试', type: 'HR', frequency: '低频', question: '你期望的薪资是多少？', answer: '提前了解市场行情，给出合理区间，表达灵活性，强调更看重成长机会。', tags: ['薪资谈判', '通用'] },
  { id: 15, category: '技术面试', type: '技术', frequency: '高频', question: '请解释一下你对数据结构和算法的理解', answer: '从常用数据结构（数组、链表、树、图）和算法（排序、搜索、动态规划）展开，结合实际应用场景。', tags: ['算法', '技术'] },
];

// GET /api/interview/questions
router.get('/questions', authMiddleware, async (req, res) => {
  try {
    const { category, frequency, type, search } = req.query;
    let questions = [...QUESTIONS_BANK];
    if (category) questions = questions.filter(q => q.category === category);
    if (frequency) questions = questions.filter(q => q.frequency === frequency);
    if (type) questions = questions.filter(q => q.type === type);
    if (search) {
      const kw = search.toLowerCase();
      questions = questions.filter(q =>
        q.question.toLowerCase().includes(kw) ||
        q.tags.some(t => t.toLowerCase().includes(kw))
      );
    }
    return res.json({ success: true, data: questions });
  } catch (err) {
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// GET /api/interview/questions/:id
router.get('/questions/:id', authMiddleware, async (req, res) => {
  try {
    const q = QUESTIONS_BANK.find(q => q.id === parseInt(req.params.id));
    if (!q) return res.status(404).json({ success: false, message: '题目不存在' });
    return res.json({ success: true, data: q });
  } catch (err) {
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// POST /api/interview/mock — AI 模拟面试
router.post('/mock', authMiddleware, async (req, res) => {
  try {
    const { interviewType, industry, answers } = req.body;
    if (!interviewType || !industry) {
      return res.status(400).json({ success: false, message: '请选择面试类型和行业' });
    }

    // 生成模拟面试反馈
    const feedback = {
      overallScore: Math.floor(Math.random() * 20) + 75,
      dimensions: {
        expression: Math.floor(Math.random() * 20) + 70,
        logic: Math.floor(Math.random() * 20) + 72,
        professionalism: Math.floor(Math.random() * 20) + 68,
        confidence: Math.floor(Math.random() * 20) + 74,
      },
      strengths: ['表达清晰，逻辑性强', '对行业有一定了解', '态度积极主动'],
      improvements: ['可以多举具体案例支撑观点', '回答可以更简洁聚焦', '建议提前了解公司背景'],
      questions: answers ? answers.map((a, i) => ({
        question: a.question,
        userAnswer: a.answer,
        suggestion: `建议使用STAR法则结构化回答，突出你的具体贡献和量化结果。`,
        score: Math.floor(Math.random() * 20) + 70,
      })) : [],
    };

    // 保存面试记录
    await db.interviewHistory.insertAsync({
      userId: req.userId,
      interviewType,
      industry,
      feedback,
      createdAt: new Date().toISOString(),
    });

    return res.json({ success: true, data: feedback });
  } catch (err) {
    console.error('[mock interview]', err);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// GET /api/interview/history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const history = await db.interviewHistory.findAsync({ userId: req.userId });
    history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.json({ success: true, data: history });
  } catch (err) {
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
