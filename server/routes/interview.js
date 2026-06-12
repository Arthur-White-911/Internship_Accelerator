const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

function formatQuestion(row) {
  return {
    id: row.id,
    question: row.question,
    category: row.category || '其他',
    frequency: row.frequency || '常见',
    answer: row.answer || '',
    type: row.type || '',
    tags: db.parseJson(row.tags, []),
  };
}

function formatSession(row) {
  return {
    id: row.id,
    sessionId: String(row.id),
    interviewType: row.interview_type || '',
    industry: row.industry || '',
    answers: db.parseJson(row.answers, []),
    score: row.score,
    strengths: db.parseJson(row.strengths, []),
    improvements: db.parseJson(row.improvements, []),
    breakdown: db.parseJson(row.breakdown, {}),
    createdAt: db.toIso(row.created_at),
  };
}

router.get('/questions', async (req, res) => {
  try {
    const { category, frequency, type, search } = req.query;
    const conditions = [];
    const params = [];

    if (category && category !== '全部') {
      conditions.push('category = ?');
      params.push(category);
    }
    if (frequency) {
      conditions.push('frequency = ?');
      params.push(frequency);
    }
    if (type) {
      conditions.push('type = ?');
      params.push(type);
    }
    if (search) {
      conditions.push('(question LIKE ? OR answer LIKE ? OR type LIKE ?)');
      const keyword = `%${search}%`;
      params.push(keyword, keyword, keyword);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = await db.query(
      `SELECT * FROM interview_questions
       ${where}
       ORDER BY FIELD(frequency, '必问', '高频', '常见'), id ASC`,
      params
    );
    return res.json({ success: true, data: rows.map(formatQuestion) });
  } catch (err) {
    console.error('[interview questions]', err);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/questions/:id', async (req, res) => {
  try {
    const row = await db.one('SELECT * FROM interview_questions WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ success: false, message: '面试题不存在' });
    return res.json({ success: true, data: formatQuestion(row) });
  } catch (err) {
    console.error('[interview question detail]', err);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/mock', authMiddleware, async (req, res) => {
  try {
    const { interviewType, industry, answers = [] } = req.body;
    const answerText = answers.map((item) => item.answer || '').join('\n');
    const answeredCount = answers.filter((item) => (item.answer || '').trim().length > 0).length;
    const lengthScore = Math.min(35, Math.floor(answerText.length / 20));
    const completeness = Math.min(30, answeredCount * 6);
    const score = Math.max(55, Math.min(95, 55 + lengthScore + completeness));

    const breakdown = {
      content: Math.min(95, score + 3),
      expression: Math.max(50, score - 4),
      logic: Math.max(50, score - 1),
    };
    const strengths = [
      answeredCount > 0 ? '能够围绕问题给出具体回答' : '已经完成模拟面试流程',
      '回答内容具备进一步打磨成 STAR 结构的基础',
    ];
    const improvements = [
      '建议补充更多具体数据、项目背景和个人贡献',
      '回答时可以使用“背景-行动-结果”的结构提升逻辑清晰度',
    ];

    const id = await db.insert(
      `INSERT INTO interview_sessions
        (user_id, interview_type, industry, answers, score, strengths, improvements, breakdown)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.userId,
        interviewType || '',
        industry || '',
        JSON.stringify(answers),
        score,
        JSON.stringify(strengths),
        JSON.stringify(improvements),
        JSON.stringify(breakdown),
      ]
    );

    await db.insert(
      `INSERT INTO notifications (user_id, type, title, content)
       VALUES (?, ?, ?, ?)`,
      [req.userId, '面试邀请', '模拟面试反馈已生成', `你的本次模拟面试得分为 ${score}/100。`]
    );

    return res.json({
      success: true,
      data: {
        sessionId: String(id),
        score,
        strengths,
        improvements,
        breakdown,
      },
    });
  } catch (err) {
    console.error('[interview mock]', err);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/history', authMiddleware, async (req, res) => {
  try {
    const rows = await db.query(
      `SELECT * FROM interview_sessions
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [req.userId]
    );
    return res.json({ success: true, data: rows.map(formatSession) });
  } catch (err) {
    console.error('[interview history]', err);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
