const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// ─── 内置面试题库 ─────────────────────────────────────────────────────────
const QUESTIONS_BANK = [
  { id: 1,  category: '行为面试', type: 'HR',   frequency: '高频', question: '请介绍一下你自己',                           answer: '建议从学校背景、专业技能、实习经历、个人优势四个维度展开，控制在2分钟以内。',                          tags: ['自我介绍', '通用'] },
  { id: 2,  category: '行为面试', type: 'HR',   frequency: '高频', question: '你的优点和缺点是什么？',                     answer: '优点结合岗位需求，缺点选择可以改进的方向，并说明改进措施。',                                          tags: ['自我认知', '通用'] },
  { id: 3,  category: '行为面试', type: 'HR',   frequency: '高频', question: '你为什么选择我们公司？',                     answer: '从公司文化、业务方向、成长空间三个角度回答，展示你做过充分调研。',                                    tags: ['动机', '通用'] },
  { id: 4,  category: '行为面试', type: 'HR',   frequency: '高频', question: '你的职业规划是什么？',                       answer: '短期（1-2年）聚焦技能提升，中期（3-5年）聚焦专业深度，长期聚焦价值贡献。',                            tags: ['职业规划', '通用'] },
  { id: 5,  category: '行为面试', type: 'HR',   frequency: '中频', question: '描述一次你遇到困难并解决的经历',             answer: '使用STAR法则：情境（Situation）、任务（Task）、行动（Action）、结果（Result）。',                    tags: ['问题解决', '通用'] },
  { id: 6,  category: '行为面试', type: 'HR',   frequency: '中频', question: '你如何处理工作中的压力？',                   answer: '举具体例子，说明你的压力管理方法，如拆解任务、优先级排序、寻求支持等。',                              tags: ['压力管理', '通用'] },
  { id: 7,  category: '技术面试', type: '技术', frequency: '高频', question: '请介绍一下你做过的最有挑战性的项目',         answer: '重点描述技术难点、你的解决思路、最终成果和学到的经验。',                                              tags: ['项目经验', '技术'] },
  { id: 8,  category: '技术面试', type: '技术', frequency: '高频', question: '你熟悉哪些编程语言和技术栈？',               answer: '按熟练程度分层介绍，重点说明你最擅长的，并结合项目经验举例。',                                        tags: ['技术能力', '技术'] },
  { id: 9,  category: '技术面试', type: '技术', frequency: '中频', question: '如何保证代码质量？',                         answer: '从代码规范、单元测试、Code Review、持续集成等方面回答。',                                            tags: ['工程实践', '技术'] },
  { id: 10, category: '技术面试', type: '技术', frequency: '中频', question: '你了解哪些设计模式？',                       answer: '介绍2-3个常用设计模式（如单例、工厂、观察者），并结合实际项目说明使用场景。',                          tags: ['设计模式', '技术'] },
  { id: 11, category: '情景面试', type: '经理', frequency: '高频', question: '如果你和同事意见不一致，你会怎么处理？',     answer: '强调沟通、理解对方立场、寻找共同目标，必要时升级到上级决策。',                                        tags: ['团队协作', '软技能'] },
  { id: 12, category: '情景面试', type: '经理', frequency: '高频', question: '如果你同时有多个紧急任务，你如何安排优先级？', answer: '使用四象限法则（紧急重要矩阵），与上级确认优先级，合理分配时间。',                                  tags: ['时间管理', '软技能'] },
  { id: 13, category: '情景面试', type: '经理', frequency: '中频', question: '如果你发现同事的工作有错误，你会怎么做？',   answer: '私下友好地指出，关注问题本身而非批评人，必要时提供帮助。',                                            tags: ['团队协作', '软技能'] },
  { id: 14, category: '行为面试', type: 'HR',   frequency: '低频', question: '你期望的薪资是多少？',                       answer: '提前了解市场行情，给出合理区间，表达灵活性，强调更看重成长机会。',                                    tags: ['薪资谈判', '通用'] },
  { id: 15, category: '技术面试', type: '技术', frequency: '高频', question: '请解释一下你对数据结构和算法的理解',         answer: '从常用数据结构（数组、链表、树、图）和算法（排序、搜索、动态规划）展开，结合实际应用场景。',            tags: ['算法', '技术'] },
];

// ─── DeepSeek AI 调用工具函数 ─────────────────────────────────────────────
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
      max_tokens: options.max_tokens || 1500,
      temperature: options.temperature || 0.5,
      response_format: options.json_mode ? { type: 'json_object' } : undefined,
    }),
  });

  const data = await response.json();
  if (!data.choices || !data.choices[0]) {
    console.error('[DeepSeek interview response]', JSON.stringify(data));
    throw new Error('DeepSeek 接口返回异常');
  }
  return data.choices[0].message.content;
}

// ─── GET /api/interview/questions ─────────────────────────────────────────
router.get('/questions', authMiddleware, async (req, res) => {
  try {
    const { category, frequency, type, search } = req.query;
    let questions = [...QUESTIONS_BANK];
    if (category)  questions = questions.filter(q => q.category === category);
    if (frequency) questions = questions.filter(q => q.frequency === frequency);
    if (type)      questions = questions.filter(q => q.type === type);
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

// ─── GET /api/interview/questions/:id ─────────────────────────────────────
router.get('/questions/:id', authMiddleware, async (req, res) => {
  try {
    const q = QUESTIONS_BANK.find(q => q.id === parseInt(req.params.id));
    if (!q) return res.status(404).json({ success: false, message: '题目不存在' });
    return res.json({ success: true, data: q });
  } catch (err) {
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// ─── POST /api/interview/mock — AI 真实评估面试 ───────────────────────────
router.post('/mock', authMiddleware, async (req, res) => {
  try {
    const { interviewType, industry, answers } = req.body;

    if (!interviewType || !industry) {
      return res.status(400).json({ success: false, message: '请选择面试类型和行业' });
    }

    // ── 整理答题内容，拼接成可供 AI 分析的文本 ──────────────────────────
    // 前端传来 answers: [{ questionId, answer }]
    // 需要根据 questionId 或直接使用答案文本来构建评估上下文
    const answersText = (answers && answers.length > 0)
      ? answers.map((a, idx) => {
          // 尝试从题库中查找题干（前端本地题库 id 从 1 开始，与类型相关）
          // 由于前端使用本地静态题库，这里直接用序号+答案内容进行评估
          const questionLabel = `第${idx + 1}题`;
          const answerContent = a.answer ? a.answer.trim() : '（未作答）';
          return `${questionLabel}：${answerContent}`;
        }).join('\n')
      : '（用户未提交具体答案）';

    const hasAnswers = answers && answers.length > 0 &&
      answers.some(a => a.answer && a.answer.trim().length > 5);

    // ── 构造 AI 评估 Prompt ──────────────────────────────────────────────
    const systemPrompt = `你是一位拥有10年经验的资深面试官，专注于大学生实习和校招面试评估。
你的任务是根据候选人在模拟面试中的表现，给出专业、客观、有建设性的评估报告。
请严格按照要求的 JSON 格式输出，不要输出任何 JSON 以外的内容。`;

    const userPrompt = `请对以下大学生的模拟面试表现进行专业评估，并以 JSON 格式返回结果。

【面试背景】
- 面试类型：${interviewType}
- 目标行业：${industry}

【候选人答题内容】
${answersText}

【评估要求】
请从以下三个维度对候选人的整体面试表现进行评分（0-100分）：
1. content（回答完整性）：回答是否切题、信息是否充分、是否覆盖了关键要点
2. logic（逻辑清晰度）：回答结构是否清晰、论点是否有支撑、是否使用了结构化表达（如STAR法则）
3. expression（表达流畅度）：语言是否简洁专业、是否有效传达了核心信息

同时给出：
- score（综合评分，0-100）：对候选人整体面试表现的综合评价
- strengths（优势亮点，2-4条）：候选人在本次面试中表现出色的具体方面，要有针对性
- improvements（改进建议，2-4条）：候选人需要重点提升的方向，要具体可执行

${!hasAnswers ? '注意：候选人未提交具体答案，请根据面试类型和行业给出通用性的评估建议。' : ''}

【输出格式】（严格遵守，仅输出 JSON）
{
  "score": <number>,
  "breakdown": {
    "content": <number>,
    "logic": <number>,
    "expression": <number>
  },
  "strengths": [
    "<具体优势1>",
    "<具体优势2>"
  ],
  "improvements": [
    "<具体建议1>",
    "<具体建议2>"
  ]
}`;

    // ── 调用 DeepSeek 进行 AI 评估 ───────────────────────────────────────
    let feedback;

    try {
      const rawContent = await callDeepSeek(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        { max_tokens: 1500, temperature: 0.5, json_mode: true }
      );

      const parsed = JSON.parse(rawContent);

      // 校验并提取字段，防止 AI 返回格式异常
      const clamp = (v, def = 75) => Math.min(100, Math.max(0, Math.round(Number(v) || def)));

      feedback = {
        sessionId: `mock_${Date.now()}`,
        score:     clamp(parsed.score, 75),
        breakdown: {
          content:    clamp(parsed.breakdown?.content,    78),
          logic:      clamp(parsed.breakdown?.logic,      74),
          expression: clamp(parsed.breakdown?.expression, 76),
        },
        strengths:    Array.isArray(parsed.strengths)    && parsed.strengths.length > 0
          ? parsed.strengths.slice(0, 4).map(s => String(s))
          : ['态度积极，愿意参与模拟面试练习'],
        improvements: Array.isArray(parsed.improvements) && parsed.improvements.length > 0
          ? parsed.improvements.slice(0, 4).map(s => String(s))
          : ['建议多进行实战练习，积累面试经验'],
      };

    } catch (aiErr) {
      // AI 调用失败时的兜底逻辑
      console.error('[interview mock AI error]', aiErr.message);
      feedback = {
        sessionId:    `mock_${Date.now()}`,
        score:        72,
        breakdown:    { content: 70, logic: 72, expression: 74 },
        strengths:    ['积极参与模拟面试，有主动提升的意识'],
        improvements: ['AI 分析服务暂时不可用，建议稍后重试以获取个性化反馈。'],
      };
    }

    // ── 持久化面试记录 ────────────────────────────────────────────────────
    await db.interviewHistory.insertAsync({
      userId: req.userId,
      interviewType,
      industry,
      answers: answers || [],
      feedback,
      createdAt: new Date().toISOString(),
    });

    return res.json({ success: true, data: feedback });
  } catch (err) {
    console.error('[mock interview]', err);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// ─── GET /api/interview/history ───────────────────────────────────────────
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
