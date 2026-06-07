import { Router } from 'express';
import { loadDb, nextId } from '../db-simple';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', (_req, res) => {
  const d = loadDb();
  res.json({ success: true, data: d.programs.map((p: any) => ({ ...p, features: Array.isArray(p.features) ? p.features : p.features })) });
});

router.get('/:id', (req, res) => {
  const d = loadDb();
  const p = d.programs.find((x: any) => x.id === parseInt(req.params.id));
  if (!p) { res.status(404).json({ success: false, message: '方案不存在' }); return; }
  res.json({ success: true, data: p });
});

router.post('/:id/enroll', authMiddleware, (req: AuthRequest, res) => {
  const d = loadDb();
  const pid = parseInt(req.params.id);
  const program = d.programs.find((x: any) => x.id === pid);
  if (!program) { res.status(404).json({ success: false, message: '方案不存在' }); return; }
  if (d.enrollments.find((e: any) => e.userId === req.user!.id && e.programId === pid)) {
    res.status(409).json({ success: false, message: '您已报名该方案' }); return;
  }
  d.enrollments.push({ id: nextId('enrollments'), userId: req.user!.id, programId: pid, status: 'active', createdAt: new Date().toISOString() });
  d.notifications.push({
    id: nextId('notifications'), userId: req.user!.id, title: '报名成功',
    content: `您已成功报名「${program.name}」，赶快开始学习吧！`, type: '训练计划', isRead: 0,
    actionType: 'training', actionData: JSON.stringify({ programId: pid }), createdAt: new Date().toISOString(),
  });
  res.json({ success: true, message: `成功报名「${program.name}」`, data: { programId: pid } });
});

router.get('/my/enrollments', authMiddleware, (req: AuthRequest, res) => {
  const d = loadDb();
  const myEnrolls = d.enrollments.filter((e: any) => e.userId === req.user!.id);
  const result = myEnrolls.map((e: any) => {
    const p = d.programs.find((prog: any) => prog.id === e.programId);
    return { ...e, level: p?.level, name: p?.name, price: p?.price, duration: p?.duration, features: p?.features };
  });
  res.json({ success: true, data: result });
});

export default router;
