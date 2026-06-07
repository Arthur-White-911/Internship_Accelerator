import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { loadDb, nextId } from '../db-simple';
import { generateToken, authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { account, password, identity = 'student' } = req.body;
    const d = loadDb();
    const user = d.users.find((u: any) => u.account === account && u.identity === identity);
    if (!user) {
      res.status(401).json({ success: false, message: '账号或密码错误' });
      return;
    }
    const isValid = bcrypt.compareSync(password, user.password);
    if (!isValid) {
      res.status(401).json({ success: false, message: '账号或密码错误' });
      return;
    }
    const token = generateToken({ id: user.id, account: user.account, identity: user.identity });
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id, account: user.account, identity: user.identity,
          name: user.name, school: user.school, major: user.major,
          phone: user.phone, email: user.email, avatar: user.avatar,
          skillProfessional: user.skillProfessional,
          skillLanguage: user.skillLanguage,
          skillSoft: user.skillSoft,
        },
      },
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/auth/register
router.post('/register', (req, res) => {
  try {
    const { account, password, confirmPassword, identity = 'student', name, school, major, phone, email } = req.body;
    if (password !== confirmPassword) {
      res.status(400).json({ success: false, message: '两次输入的密码不一致' });
      return;
    }
    const d = loadDb();
    if (d.users.find((u: any) => u.account === account)) {
      res.status(409).json({ success: false, message: '该账号已被注册' });
      return;
    }
    const hashedPw = bcrypt.hashSync(password, 10);
    const userId = nextId('users');
    const now = new Date().toISOString();
    d.users.push({
      id: userId, account, password: hashedPw, identity,
      name: name || account, school: school || '', major: major || '',
      phone: phone || account, email: email || '', avatar: '/student-avatar-1.png',
      skillProfessional: '初级', skillLanguage: '中级', skillSoft: '高级',
      createdAt: now, updatedAt: now,
    });
    // Welcome notification
    d.notifications.push({
      id: nextId('notifications'), userId, title: '欢迎加入实习加速器',
      content: '恭喜你成功注册！开始你的职业加速之旅吧。', type: '系统', isRead: 0,
      actionType: null, actionData: null, createdAt: now,
    });
    const token = generateToken({ id: userId, account, identity });
    res.json({ success: true, data: { token, user: { id: userId, account, identity, name: name || account } } });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req: AuthRequest, res) => {
  try {
    const d = loadDb();
    const user = d.users.find((u: any) => u.id === req.user!.id);
    if (!user) {
      res.status(404).json({ success: false, message: '用户不存在' });
      return;
    }
    res.json({
      success: true,
      data: {
        id: user.id, account: user.account, identity: user.identity,
        name: user.name, school: user.school, major: user.major,
        phone: user.phone, email: user.email, avatar: user.avatar,
        skillProfessional: user.skillProfessional,
        skillLanguage: user.skillLanguage,
        skillSoft: user.skillSoft,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/auth/profile
router.put('/profile', authMiddleware, (req: AuthRequest, res) => {
  try {
    const { name, school, major, phone, email } = req.body;
    const d = loadDb();
    const user = d.users.find((u: any) => u.id === req.user!.id);
    if (user) {
      user.name = name || user.name;
      user.school = school || user.school;
      user.major = major || user.major;
      user.phone = phone || user.phone;
      user.email = email || user.email;
      user.updatedAt = new Date().toISOString();
    }
    res.json({ success: true, message: '个人信息已更新' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/auth/password
router.put('/password', authMiddleware, (req: AuthRequest, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const d = loadDb();
    const user = d.users.find((u: any) => u.id === req.user!.id);
    if (!user || !bcrypt.compareSync(oldPassword, user.password)) {
      res.status(400).json({ success: false, message: '原密码不正确' });
      return;
    }
    user.password = bcrypt.hashSync(newPassword, 10);
    res.json({ success: true, message: '密码已修改' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
