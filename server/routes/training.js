const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const { JWT_SECRET } = require('../config');

const router = express.Router();

function optionalUserId(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try {
    return Number(jwt.verify(token, JWT_SECRET).userId);
  } catch {
    return null;
  }
}

function formatProject(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    category: row.category,
    duration: row.duration || '',
    difficulty: row.difficulty || '初级',
    content: row.content || '',
    image: row.image || '/training-coding.png',
  };
}

function formatSession(row) {
  return {
    id: row.id,
    topic: row.topic,
    duration: row.duration || '60',
    status: row.status || 'completed',
    suggestion: row.suggestion || '',
    createdAt: db.toIso(row.created_at),
    category: row.category || 'skill',
    difficulty: row.difficulty || '初级',
  };
}

function buildSuggestions({ topic, category, duration }) {
  const categoryLabel = {
    skill: '技能训练',
    language: '语言训练',
    softskill: '软技能训练',
  }[category] || '综合训练';

  return [
    `先用 10 分钟明确「${topic}」的训练目标和可交付成果。`,
    `围绕${categoryLabel}拆成 2-3 个小任务，每完成一项做一次复盘。`,
    `本次训练预计 ${duration} 分钟，建议最后保留 5 分钟记录收获和下一步计划。`,
  ];
}

router.get('/projects', async (req, res) => {
  try {
    const { category } = req.query;
    const rows = category
      ? await db.query('SELECT * FROM training_projects WHERE category = ? ORDER BY id ASC', [category])
      : await db.query('SELECT * FROM training_projects ORDER BY id ASC');
    return res.json({ success: true, data: rows.map(formatProject) });
  } catch (err) {
    console.error('[training projects]', err);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/projects/:id', async (req, res) => {
  try {
    const row = await db.one('SELECT * FROM training_projects WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ success: false, message: '训练项目不存在' });
    return res.json({ success: true, data: formatProject(row) });
  } catch (err) {
    console.error('[training project detail]', err);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/start', authMiddleware, async (req, res) => {
  try {
    const { projectId, topic, content = '', duration = '60' } = req.body;
    if (!topic || !topic.trim()) {
      return res.status(400).json({ success: false, message: '训练主题不能为空' });
    }

    const project = projectId
      ? await db.one('SELECT * FROM training_projects WHERE id = ?', [projectId])
      : null;
    const category = project?.category || 'skill';
    const difficulty = project?.difficulty || '初级';
    const suggestions = buildSuggestions({ topic: topic.trim(), category, duration });

    const sessionId = await db.insert(
      `INSERT INTO training_sessions
        (user_id, project_id, topic, content, duration, category, difficulty, status, suggestion)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', ?)`,
      [
        req.userId,
        project?.id || null,
        topic.trim(),
        content,
        duration,
        category,
        difficulty,
        suggestions.join('\n'),
      ]
    );

    await db.insert(
      `INSERT INTO notifications (user_id, type, title, content)
       VALUES (?, ?, ?, ?)`,
      [req.userId, '训练计划', '训练记录已保存', `「${topic.trim()}」训练已记录到你的个人中心。`]
    );

    return res.json({
      success: true,
      data: {
        sessionId,
        topic: topic.trim(),
        duration,
        suggestions,
      },
    });
  } catch (err) {
    console.error('[training start]', err);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/sessions', async (req, res) => {
  try {
    const userId = optionalUserId(req);
    if (!userId) return res.json({ success: true, data: [] });

    const rows = await db.query(
      `SELECT * FROM training_sessions
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );
    return res.json({ success: true, data: rows.map(formatSession) });
  } catch (err) {
    console.error('[training sessions]', err);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/progress', async (req, res) => {
  try {
    const userId = optionalUserId(req);
    if (!userId) {
      return res.json({
        success: true,
        data: [
          { category: 'skill', percent: 0 },
          { category: 'language', percent: 0 },
          { category: 'softskill', percent: 0 },
        ],
      });
    }

    const rows = await db.query(
      `SELECT category, COUNT(*) AS count
       FROM training_sessions
       WHERE user_id = ?
       GROUP BY category`,
      [userId]
    );
    const counts = Object.fromEntries(rows.map((row) => [row.category, Number(row.count)]));
    const data = ['skill', 'language', 'softskill'].map((category) => ({
      category,
      percent: Math.min(100, (counts[category] || 0) * 20),
    }));

    return res.json({ success: true, data });
  } catch (err) {
    console.error('[training progress]', err);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
