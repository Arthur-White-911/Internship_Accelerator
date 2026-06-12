const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config');

const router = express.Router();

// 生成 token
function signToken(user) {
  return jwt.sign({ userId: user._id, account: user.account }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// 格式化用户对象（去掉密码）
function formatUser(user) {
  const { password, ...rest } = user;
  return rest;
}

// ─── POST /api/auth/register ───────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { account, password, confirmPassword, name, school, major, phone, email, identity = 'student' } = req.body;

    // 参数校验
    if (!account || !password) {
      return res.status(400).json({ success: false, message: '账号和密码不能为空' });
    }
    if (account.length < 4) {
      return res.status(400).json({ success: false, message: '账号长度不能少于4位' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: '密码长度不能少于6位' });
    }
    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ success: false, message: '两次密码输入不一致' });
    }

    // 检查账号是否已存在
    const existing = await db.users.findOneAsync({ account });
    if (existing) {
      return res.status(409).json({ success: false, message: '该账号已被注册' });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const newUser = await db.users.insertAsync({
      account,
      password: hashedPassword,
      identity,
      name: name || account,
      school: school || '',
      major: major || '',
      phone: phone || '',
      email: email || '',
      avatar: '',
      skillProfessional: '',
      skillLanguage: '',
      skillSoft: '',
      createdAt: new Date().toISOString(),
    });

    const token = signToken(newUser);

    // 创建欢迎通知
    await db.notifications.insertAsync({
      userId: newUser._id,
      type: 'system',
      title: '欢迎加入实习加速器！',
      content: '你已成功注册，快去完成能力测评，开启你的求职加速之旅吧！',
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    return res.status(201).json({
      success: true,
      message: '注册成功',
      data: { token, user: formatUser(newUser) },
    });
  } catch (err) {
    console.error('[register]', err);
    return res.status(500).json({ success: false, message: '服务器错误，请稍后重试' });
  }
});

// ─── POST /api/auth/login ──────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { account, password, identity } = req.body;

    if (!account || !password) {
      return res.status(400).json({ success: false, message: '账号和密码不能为空' });
    }

    const user = await db.users.findOneAsync({ account });
    if (!user) {
      return res.status(401).json({ success: false, message: '账号不存在' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: '密码错误' });
    }

    const token = signToken(user);

    return res.json({
      success: true,
      message: '登录成功',
      data: { token, user: formatUser(user) },
    });
  } catch (err) {
    console.error('[login]', err);
    return res.status(500).json({ success: false, message: '服务器错误，请稍后重试' });
  }
});

// ─── GET /api/auth/me ──────────────────────────────────────────────────────
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await db.users.findOneAsync({ _id: req.userId });
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    return res.json({ success: true, data: formatUser(user) });
  } catch (err) {
    console.error('[me]', err);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// ─── PUT /api/auth/profile ─────────────────────────────────────────────────
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, school, major, phone, email, avatar, skillProfessional, skillLanguage, skillSoft } = req.body;

    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (school !== undefined) updateFields.school = school;
    if (major !== undefined) updateFields.major = major;
    if (phone !== undefined) updateFields.phone = phone;
    if (email !== undefined) updateFields.email = email;
    if (avatar !== undefined) updateFields.avatar = avatar;
    if (skillProfessional !== undefined) updateFields.skillProfessional = skillProfessional;
    if (skillLanguage !== undefined) updateFields.skillLanguage = skillLanguage;
    if (skillSoft !== undefined) updateFields.skillSoft = skillSoft;
    updateFields.updatedAt = new Date().toISOString();

    await db.users.updateAsync({ _id: req.userId }, { $set: updateFields });
    const updated = await db.users.findOneAsync({ _id: req.userId });

    return res.json({ success: true, message: '保存成功', data: formatUser(updated) });
  } catch (err) {
    console.error('[update profile]', err);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// ─── PUT /api/auth/password ────────────────────────────────────────────────
router.put('/password', authMiddleware, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: '请填写原密码和新密码' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: '新密码长度不能少于6位' });
    }

    const user = await db.users.findOneAsync({ _id: req.userId });
    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: '原密码错误' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.users.updateAsync({ _id: req.userId }, { $set: { password: hashed } });

    return res.json({ success: true, message: '密码修改成功' });
  } catch (err) {
    console.error('[change password]', err);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
