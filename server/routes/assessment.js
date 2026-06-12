const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

function clamp(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function buildAssessment({ skillLevel, experience, careerGoal }) {
  const levelMap = { 初级: 42, 中级: 68, 高级: 84 };
  const base = levelMap[skillLevel] || 55;
  const expBonus = experience && experience.trim().length > 30 ? 8 : 0;
  const goalBonus = careerGoal ? 4 : 0;

  const scores = {
    professional: clamp(base + expBonus + 6),
    practical: clamp(base + expBonus),
    communication: clamp(base + goalBonus - 2),
    teamwork: clamp(base + 5),
    innovation: clamp(base + goalBonus + 3),
  };
  const matchPercent = clamp(
    Object.values(scores).reduce((sum, value) => sum + value, 0) / Object.keys(scores).length
  );

  const suggestions = [];
  if (scores.professional < 65) suggestions.push('建议加强岗位核心技能训练，优先完成技术或业务基础模块。');
  if (scores.practical < 65) suggestions.push('建议补充项目经历，把课程知识转化成可展示的作品或案例。');
  if (scores.communication < 65) suggestions.push('建议多做模拟面试，训练表达结构和回答节奏。');
  if (matchPercent >= 80) suggestions.push('综合匹配度较高，可以开始冲刺高质量实习并完善简历。');
  if (matchPercent < 80) suggestions.push('建议选择匹配的培养方案，按阶段补齐短板。');

  return { scores, matchPercent, suggestions };
}

function formatRecord(row) {
  const suggestions = db.parseJson(row.suggestions, []);
  return {
    id: row.id,
    major: row.major || '',
    skillLevel: row.skill_level || '',
    experience: row.experience || '',
    careerGoal: row.career_goal || '',
    matchPercent: row.match_percent,
    scores: {
      professional: row.professional_score,
      practical: row.practical_score,
      communication: row.communication_score,
      teamwork: row.teamwork_score,
      innovation: row.innovation_score,
    },
    suggestions,
    createdAt: db.toIso(row.created_at),
  };
}

router.post('/submit', authMiddleware, async (req, res) => {
  try {
    const { major, skillLevel, experience = '', careerGoal } = req.body;
    if (!major || !skillLevel || !careerGoal) {
      return res.status(400).json({ success: false, message: '请填写完整信息' });
    }

    const { scores, matchPercent, suggestions } = buildAssessment({
      skillLevel,
      experience,
      careerGoal,
    });

    const id = await db.insert(
      `INSERT INTO assessment_results
        (user_id, major, skill_level, experience, career_goal, match_percent,
         professional_score, practical_score, communication_score, teamwork_score,
         innovation_score, suggestions)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.userId,
        major,
        skillLevel,
        experience,
        careerGoal,
        matchPercent,
        scores.professional,
        scores.practical,
        scores.communication,
        scores.teamwork,
        scores.innovation,
        JSON.stringify(suggestions),
      ]
    );

    await db.insert(
      `INSERT INTO notifications (user_id, type, title, content)
       VALUES (?, ?, ?, ?)`,
      [
        req.userId,
        '测评结果',
        '能力分析报告已生成',
        `你的职业匹配度为 ${matchPercent}%，快去查看详细报告吧！`,
      ]
    );

    const row = await db.one('SELECT * FROM assessment_results WHERE id = ?', [id]);
    return res.json({ success: true, data: formatRecord(row) });
  } catch (err) {
    console.error('[assessment submit]', err);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/history', authMiddleware, async (req, res) => {
  try {
    const rows = await db.query(
      `SELECT * FROM assessment_results
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [req.userId]
    );
    return res.json({ success: true, data: rows.map(formatRecord) });
  } catch (err) {
    console.error('[assessment history]', err);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/latest', authMiddleware, async (req, res) => {
  try {
    const row = await db.one(
      `SELECT * FROM assessment_results
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [req.userId]
    );
    return res.json({ success: true, data: row ? formatRecord(row) : null });
  } catch (err) {
    console.error('[assessment latest]', err);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
