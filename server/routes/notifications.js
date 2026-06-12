const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/notifications
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { type, isRead } = req.query;
    const query = { userId: req.userId };
    if (type) query.type = type;
    if (isRead !== undefined) query.isRead = isRead === 'true';

    const notifications = await db.notifications.findAsync(query);
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.json({ success: true, data: notifications });
  } catch (err) {
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// GET /api/notifications/stats
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const total = await db.notifications.countAsync({ userId: req.userId });
    const unread = await db.notifications.countAsync({ userId: req.userId, isRead: false });
    return res.json({ success: true, data: { total, unread } });
  } catch (err) {
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    await db.notifications.updateAsync(
      { _id: req.params.id, userId: req.userId },
      { $set: { isRead: true } }
    );
    return res.json({ success: true, message: '已标记为已读' });
  } catch (err) {
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// PUT /api/notifications/read-all
router.put('/read-all', authMiddleware, async (req, res) => {
  try {
    await db.notifications.updateAsync(
      { userId: req.userId, isRead: false },
      { $set: { isRead: true } },
      { multi: true }
    );
    return res.json({ success: true, message: '全部已读' });
  } catch (err) {
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// DELETE /api/notifications/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await db.notifications.removeAsync({ _id: req.params.id, userId: req.userId });
    return res.json({ success: true, message: '已删除' });
  } catch (err) {
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
