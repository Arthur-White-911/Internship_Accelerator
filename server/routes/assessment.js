const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// POST /api/assessment/submit
router.post('/submit', authMiddleware, async (req, res) => {
  try {
    const { major, skillLevel, experience, careerGoal } = req.body;

    if (!major || !skillLevel || !careerGoal) {
      return res.status(400).json({ success: false, message: '请填写完整信息' });
    }

    // 简单评分逻辑
    const levelMap = { '初级': 30, '中级': 60, '高级': 90 };
    const baseScore = levelMap[skillLevel] || 50;
    const expBonus = experience && experience.length > 20 ? 10 : 0;

    const scores = {
      technical: Math.min(100, baseScore + expBonus + Math.floor(Math.random() * 10)),
      communication: Math.min(100, baseScore - 5 + Math.floor(Math.random() * 15)),
      problemSolving: Math.min(100, baseScore + Math.floor(Math.random() * 12)),
      teamwork: Math.min(100, baseScore + 5 + Math.floor(Math.random() * 10)),
    };

    const overall = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / 4);

    const suggestions = [];
    if (scores.technical < 60) suggestions.push('建议加强技术基础，可参考我们的技能培训模块');
    if (scores.communication < 60) suggestions.push('建议提升沟通表达能力，多参与模拟面试练习');
    if (overall >= 80) suggestions.push('综合能力优秀，建议直接冲击头部企业');
    else if (overall >= 60) suggestions.push('基础扎实，建议针对目标岗位进行专项提升');
    else suggestions.push('建议系统性学习，从入门培养方案开始');

    const record = await db.assessments.insertAsync({
      userId: req.userId,
      major,
      skillLevel,
      experience: experience || '',
      careerGoal,
      scores,
      overall,
      suggestions,
      createdAt: new Date().toISOString(),
    });

    // 添加通知
    await db.notifications.insertAsync({
      userId: req.userId,
      type: 'assessment',
      title: '能力分析报告已生成',
      content: `你的综合能力评分为 ${overall} 分，快去查看详细报告吧！`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    return res.json({ success: true, data: record });
  } catch (err) {
    console.error('[assessment submit]', err);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// GET /api/assessment/history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const records = await db.assessments.findAsync({ userId: req.userId });
    records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.json({ success: true, data: records });
  } catch (err) {
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// GET /api/assessment/latest
router.get('/latest', authMiddleware, async (req, res) => {
  try {
    const records = await db.assessments.findAsync({ userId: req.userId });
    if (!records.length) return res.json({ success: true, data: null });
    records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.json({ success: true, data: records[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
