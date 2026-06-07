import { Router } from 'express';
import { loadDb } from '../db-simple';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, (req: AuthRequest, res) => {
  const d = loadDb();
  const user = d.users.find((u: any) => u.id === req.user!.id);
  if (!user) { res.status(404).json({ success: false, message: '用户不存在' }); return; }
  res.json({
    success: true,
    data: {
      id: user.id, account: user.account, identity: user.identity,
      name: user.name, school: user.school, major: user.major,
      phone: user.phone, email: user.email, avatar: user.avatar,
      skillProfessional: user.skillProfessional,
      skillLanguage: user.skillLanguage,
      skillSoft: user.skillSoft,
      createdAt: user.createdAt,
    },
  });
});

router.put('/', authMiddleware, (req: AuthRequest, res) => {
  const { name, school, major, phone, email } = req.body;
  const d = loadDb();
  const user = d.users.find((u: any) => u.id === req.user!.id);
  if (user) {
    user.name = name ?? user.name;
    user.school = school ?? user.school;
    user.major = major ?? user.major;
    user.phone = phone ?? user.phone;
    user.email = email ?? user.email;
    user.updatedAt = new Date().toISOString();
  }
  res.json({ success: true, message: '个人信息已更新' });
});

router.get('/training-records', authMiddleware, (req: AuthRequest, res) => {
  const d = loadDb();
  const rows = d.trainingSessions.filter((s: any) => s.userId === req.user!.id)
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((s: any) => {
      const p = d.trainingProjects.find((tp: any) => tp.id === s.projectId);
      return { ...s, category: p?.category, difficulty: p?.difficulty };
    });
  res.json({ success: true, data: rows });
});

router.get('/certificates', authMiddleware, (req: AuthRequest, res) => {
  const d = loadDb();
  const rows = d.certificates.filter((c: any) => c.userId === req.user!.id)
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ success: true, data: rows });
});

export default router;
