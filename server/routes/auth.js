const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const { JWT_EXPIRES_IN, JWT_SECRET } = require('../config');

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { userId: user.id, account: user.account },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function formatUser(row) {
  if (!row) return null;
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

async function getUserById(id) {
  return db.one('SELECT * FROM users WHERE id = ?', [id]);
}

router.post('/register', async (req, res) => {
  try {
    const {
      account,
      password,
      confirmPassword,
      name,
      school,
      major,
      phone,
      email,
      identity = 'student',
    } = req.body;

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

    const existing = await db.one('SELECT id FROM users WHERE account = ?', [account]);
    if (existing) {
      return res.status(409).json({ success: false, message: '该账号已被注册' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = await db.insert(
      `INSERT INTO users
        (account, password_hash, identity, name, school, major, phone, email)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        account,
        passwordHash,
        identity,
        name || account,
        school || '',
        major || '',
        phone || '',
        email || '',
      ]
    );

    await db.insert(
      `INSERT INTO notifications (user_id, type, title, content)
       VALUES (?, ?, ?, ?)`,
      [
        userId,
        '系统',
        '欢迎加入实习加速器',
        '你已成功注册，快去完成能力测评，开启你的求职加速之旅吧！',
      ]
    );

    const user = await getUserById(userId);
    const token = signToken(user);

    return res.status(201).json({
      success: true,
      message: '注册成功',
      data: { token, user: formatUser(user) },
    });
  } catch (err) {
    console.error('[register]', err);
    return res.status(500).json({ success: false, message: '服务器错误，请稍后重试' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { account, password, identity } = req.body;
    if (!account || !password) {
      return res.status(400).json({ success: false, message: '账号和密码不能为空' });
    }

    const user = await db.one('SELECT * FROM users WHERE account = ?', [account]);
    if (!user) {
      return res.status(401).json({ success: false, message: '账号不存在' });
    }
    if (identity && user.identity !== identity) {
      return res.status(401).json({ success: false, message: '账号身份不匹配' });
    }

    const matched = await bcrypt.compare(password, user.password_hash);
    if (!matched) {
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

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await getUserById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    return res.json({ success: true, data: formatUser(user) });
  } catch (err) {
    console.error('[me]', err);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const allowed = {
      name: 'name',
      school: 'school',
      major: 'major',
      phone: 'phone',
      email: 'email',
      avatar: 'avatar',
      skillProfessional: 'skill_professional',
      skillLanguage: 'skill_language',
      skillSoft: 'skill_soft',
    };
    const sets = [];
    const values = [];

    Object.entries(allowed).forEach(([inputKey, column]) => {
      if (req.body[inputKey] !== undefined) {
        sets.push(`${column} = ?`);
        values.push(req.body[inputKey]);
      }
    });

    if (sets.length) {
      values.push(req.userId);
      await db.run(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, values);
    }

    const user = await getUserById(req.userId);
    return res.json({ success: true, message: '保存成功', data: formatUser(user) });
  } catch (err) {
    console.error('[update profile]', err);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.put('/password', authMiddleware, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: '请填写原密码和新密码' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: '新密码长度不能少于6位' });
    }

    const user = await getUserById(req.userId);
    const matched = await bcrypt.compare(oldPassword, user.password_hash);
    if (!matched) {
      return res.status(401).json({ success: false, message: '原密码错误' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.run('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, req.userId]);

    return res.json({ success: true, message: '密码修改成功' });
  } catch (err) {
    console.error('[change password]', err);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
