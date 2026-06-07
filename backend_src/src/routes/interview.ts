import { Router } from 'express';
import { loadDb, nextId } from '../db-simple';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/questions', (req, res) => {
  const { category, frequency, type, search } = req.query;
  const d = loadDb();
  let qs = [...d.interviewQuestions];
  if (category) qs = qs.filter((q: any) => q.category === category);
  if (frequency) qs = qs.filter((q: any) => q.frequency === frequency);
  if (type) qs = qs.filter((q: any) => q.type === type);
  if (search) {
    const s = String(search).toLowerCase();
    qs = qs.filter((q: any) => q.question.toLowerCase().includes(s) || q.answer.toLowerCase().includes(s));
  }
  qs.sort((a: any, b: any) => {
    const freqOrder = { '必问': 3, '高频': 2, '常见': 1 };
    return (freqOrder[b.frequency as keyof typeof freqOrder] || 0) - (freqOrder[a.frequency as keyof typeof freqOrder] || 0);
  });
  res.json({ success: true, data: qs });
});

router.get('/questions/:id', (req, res) => {
  const d = loadDb();
  const q = d.interviewQuestions.find((x: any) => x.id === parseInt(req.params.id));
  if (!q) { res.status(404).json({ success: false, message: '题目不存在' }); return; }
  res.json({ success: true, data: q });
});

router.post('/mock', authMiddleware, (req: AuthRequest, res) => {
  const { interviewType, industry } = req.body;
  const score = Math.floor(65 + Math.random() * 30);
  const strengths = ['表达逻辑清晰，能够按STAR法则组织回答', '对岗位有一定了解，展现了求职诚意', '态度积极，沟通流畅'];
  const improvements = ['可以加入更多量化数据支撑观点', '建议在回答中更多地体现团队协作经历', '对行业趋势的了解可以更深入'];
  const d = loadDb();
  const id = nextId('interviewSessions');
  d.interviewSessions.push({
    id, userId: req.user!.id, interviewType, industry, score,
    feedback: `您的模拟面试得分${score}分，整体表现良好。`,
    strengths: JSON.stringify(strengths), improvements: JSON.stringify(improvements),
    status: 'completed', createdAt: new Date().toISOString(),
  });
  res.json({
    success: true,
    data: { sessionId: id, score, strengths, improvements,
      breakdown: { content: Math.floor(60 + Math.random() * 30), expression: Math.floor(65 + Math.random() * 30), logic: Math.floor(60 + Math.random() * 35) } },
  });
});

router.get('/history', authMiddleware, (req: AuthRequest, res) => {
  const d = loadDb();
  const rows = d.interviewSessions.filter((s: any) => s.userId === req.user!.id)
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ success: true, data: rows });
});

export default router;
