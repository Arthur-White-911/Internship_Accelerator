import { Router } from 'express';
import { loadDb } from '../db-simple';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, (req: AuthRequest, res) => {
  const { type, isRead } = req.query;
  const d = loadDb();
  let notifs = d.notifications.filter((n: any) => n.userId === req.user!.id);
  if (type) notifs = notifs.filter((n: any) => n.type === type);
  if (isRead !== undefined) notifs = notifs.filter((n: any) => n.isRead === (isRead === 'true' ? 1 : 0));
  notifs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ success: true, data: notifs });
});

router.get('/stats', authMiddleware, (req: AuthRequest, res) => {
  const d = loadDb();
  const userNotifs = d.notifications.filter((n: any) => n.userId === req.user!.id);
  res.json({ success: true, data: { total: userNotifs.length, unread: userNotifs.filter((n: any) => n.isRead === 0).length } });
});

router.put('/:id/read', authMiddleware, (req: AuthRequest, res) => {
  const d = loadDb();
  const n = d.notifications.find((x: any) => x.id === parseInt(req.params.id) && x.userId === req.user!.id);
  if (n) n.isRead = 1;
  res.json({ success: true, message: '已标记为已读' });
});

router.put('/read-all', authMiddleware, (req: AuthRequest, res) => {
  const d = loadDb();
  d.notifications.filter((n: any) => n.userId === req.user!.id).forEach((n: any) => n.isRead = 1);
  res.json({ success: true, message: '全部标记为已读' });
});

router.delete('/:id', authMiddleware, (req: AuthRequest, res) => {
  const d = loadDb();
  d.notifications = d.notifications.filter((n: any) => !(n.id === parseInt(req.params.id) && n.userId === req.user!.id));
  res.json({ success: true, message: '通知已删除' });
});

export default router;
