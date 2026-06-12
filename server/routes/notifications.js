const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

function formatNotification(row) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    content: row.content || '',
    isRead: Boolean(row.is_read),
    createdAt: db.toIso(row.created_at),
  };
}

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { type, isRead } = req.query;
    const conditions = ['user_id = ?'];
    const params = [req.userId];

    if (type && type !== 'all') {
      conditions.push('type = ?');
      params.push(type);
    }
    if (isRead !== undefined) {
      conditions.push('is_read = ?');
      params.push(isRead === 'true' ? 1 : 0);
    }

    const rows = await db.query(
      `SELECT * FROM notifications
       WHERE ${conditions.join(' AND ')}
       ORDER BY created_at DESC`,
      params
    );

    return res.json({ success: true, data: rows.map(formatNotification) });
  } catch (err) {
    console.error('[notifications list]', err);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const row = await db.one(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) AS unread
       FROM notifications
       WHERE user_id = ?`,
      [req.userId]
    );
    return res.json({
      success: true,
      data: { total: Number(row.total || 0), unread: Number(row.unread || 0) },
    });
  } catch (err) {
    console.error('[notifications stats]', err);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.put('/read-all', authMiddleware, async (req, res) => {
  try {
    await db.run('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.userId]);
    return res.json({ success: true, message: '全部已读' });
  } catch (err) {
    console.error('[notifications read-all]', err);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    await db.run(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [req.params.id, req.userId]
    );
    return res.json({ success: true, message: '已标记为已读' });
  } catch (err) {
    console.error('[notifications mark-read]', err);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await db.run('DELETE FROM notifications WHERE id = ? AND user_id = ?', [
      req.params.id,
      req.userId,
    ]);
    return res.json({ success: true, message: '已删除' });
  } catch (err) {
    console.error('[notifications delete]', err);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
