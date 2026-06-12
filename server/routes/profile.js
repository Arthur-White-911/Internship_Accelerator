const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

function formatUser(row) {
  return {
    id: row.id,
    account: row.account,
    identity: row.identity,
    name: row.name || row.account,
    school: row.school || '',
    major: row.major || '',
    phone: row.phone || '',
    email: row.email || '',
    avatar: row.avatar || '',
    skillProfessional: row.skill_professional || '',
    skillLanguage: row.skill_language || '',
    skillSoft: row.skill_soft || '',
  };
}

router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await db.one('SELECT * FROM users WHERE id = ?', [req.userId]);
    if (!user) return res.status(404).json({ success: false, message: '用户不存在' });
    return res.json({ success: true, data: formatUser(user) });
  } catch (err) {
    console.error('[profile get]', err);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.put('/', authMiddleware, async (req, res) => {
  try {
    const allowed = ['name', 'school', 'major', 'phone', 'email'];
    const sets = [];
    const values = [];

    allowed.forEach((field) => {
      if (req.body[field] !== undefined) {
        sets.push(`${field} = ?`);
        values.push(req.body[field]);
      }
    });

    if (sets.length) {
      values.push(req.userId);
      await db.run(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, values);
    }

    const user = await db.one('SELECT * FROM users WHERE id = ?', [req.userId]);
    return res.json({ success: true, message: '保存成功', data: formatUser(user) });
  } catch (err) {
    console.error('[profile update]', err);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/training-records', authMiddleware, async (req, res) => {
  try {
    const rows = await db.query(
      `SELECT ts.id, ts.topic, ts.category, ts.difficulty, ts.duration, ts.status, ts.created_at
       FROM training_sessions ts
       WHERE ts.user_id = ?
       ORDER BY ts.created_at DESC`,
      [req.userId]
    );

    const records = rows.map((row) => ({
      id: row.id,
      topic: row.topic,
      category: row.category || 'skill',
      difficulty: row.difficulty || '初级',
      duration: Number.parseInt(row.duration, 10) || 0,
      status: row.status === 'completed' ? '已完成' : '进行中',
      createdAt: db.toIso(row.created_at),
    }));

    return res.json({ success: true, data: records });
  } catch (err) {
    console.error('[profile training-records]', err);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/certificates', authMiddleware, async (req, res) => {
  try {
    const rows = await db.query(
      `SELECT id, title, issuer, cert_date, cert_no, image
       FROM certificates
       WHERE user_id = ?
       ORDER BY cert_date DESC, id DESC`,
      [req.userId]
    );
    const certificates = rows.map((row) => ({
      id: row.id,
      title: row.title,
      issuer: row.issuer || '',
      certDate: row.cert_date ? db.toIso(row.cert_date).slice(0, 10) : '',
      certNo: row.cert_no || '',
      image: row.image || '',
    }));
    return res.json({ success: true, data: certificates });
  } catch (err) {
    console.error('[profile certificates]', err);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
