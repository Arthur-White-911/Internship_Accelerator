const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

function formatUser(user) {
  const { password, ...rest } = user;
  return rest;
}

// GET /api/profile
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await db.users.findOneAsync({ _id: req.userId });
    if (!user) return res.status(404).json({ success: false, message: '用户不存在' });
    return res.json({ success: true, data: formatUser(user) });
  } catch (err) {
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// PUT /api/profile
router.put('/', authMiddleware, async (req, res) => {
  try {
    const { name, school, major, phone, email } = req.body;
    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (school !== undefined) updateFields.school = school;
    if (major !== undefined) updateFields.major = major;
    if (phone !== undefined) updateFields.phone = phone;
    if (email !== undefined) updateFields.email = email;
    updateFields.updatedAt = new Date().toISOString();

    await db.users.updateAsync({ _id: req.userId }, { $set: updateFields });
    const updated = await db.users.findOneAsync({ _id: req.userId });
    return res.json({ success: true, message: '保存成功', data: formatUser(updated) });
  } catch (err) {
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// GET /api/profile/training-records
router.get('/training-records', authMiddleware, async (req, res) => {
  try {
    const records = await db.trainingRecords.findAsync({ userId: req.userId });
    return res.json({ success: true, data: records });
  } catch (err) {
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// GET /api/profile/certificates
router.get('/certificates', authMiddleware, async (req, res) => {
  return res.json({ success: true, data: [] });
});

module.exports = router;
