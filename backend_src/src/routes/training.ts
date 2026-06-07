import { Router } from 'express';
import { loadDb, nextId } from '../db-simple';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/projects', (req, res) => {
  const { category } = req.query;
  const d = loadDb();
  let ps = [...d.trainingProjects];
  if (category) ps = ps.filter((p: any) => p.category === category);
  ps.sort((a: any, b: any) => { const dOrder = { '初级': 1, '中级': 2, '高级': 3 }; return (dOrder[a.difficulty] || 0) - (dOrder[b.difficulty] || 0); });
  res.json({ success: true, data: ps });
});

router.get('/projects/:id', (req, res) => {
  const d = loadDb();
  const p = d.trainingProjects.find((x: any) => x.id === parseInt(req.params.id));
  if (!p) { res.status(404).json({ success: false, message: '项目不存在' }); return; }
  res.json({ success: true, data: p });
});

router.post('/start', authMiddleware, (req: AuthRequest, res) => {
  const { projectId, topic, content, duration } = req.body;
  const d = loadDb();
  const project = d.trainingProjects.find((p: any) => p.id === parseInt(projectId));
  const suggestionSets: Record<string, string[]> = {
    'JavaScript基础强化': ['建议继续深入学习ES6+新特性','多写代码巩固基础，每天至少练习30分钟','尝试用所学知识实现一个小项目'],
    '前端框架实践': ['先深入理解一个框架，不要贪多','阅读官方文档和源码是最佳学习方式','尝试参与开源项目贡献'],
    '算法与数据结构': ['建议先掌握基础数据结构','每天刷1-2道算法题，保持手感','理解算法原理比死记代码更重要'],
    '后端开发基础': ['理解HTTP协议和RESTful API设计','学习数据库设计和优化','掌握基本的Linux命令和服务器部署'],
    '英语口语练习': ['坚持每天练习15分钟，保持语感','模仿native speaker的发音和语调','不要害怕犯错，多说才能进步'],
    '商务英语写作': ['注意邮件的格式和礼貌用语','多用正式表达，避免口语化','写完后检查拼写和语法'],
    '技术英语': ['多阅读英文技术文档','背诵常见的技术术语和缩写','尝试用英语写技术博客'],
    '沟通技巧提升': ['沟通是双向的，学会倾听比会说更重要','注意非语言信号，如眼神和肢体语言','在冲突中保持冷静和理性'],
    '领导力培养': ['领导力不等于权威，赢得信任是关键','学会授权和信任团队成员','以身作则，用行动影响他人'],
    '时间管理': ['使用番茄工作法提高专注度','区分重要和紧急，优先处理重要的事','定期复盘时间使用情况'],
    '演讲与展示': ['准备充分是自信的来源','用故事和数据让内容更有说服力','多与观众互动，保持眼神交流'],
  };
  const suggestions = suggestionSets[topic] || ['建议定期复习所学内容','将理论应用到实践中','保持持续学习的习惯'];
  const sid = nextId('trainingSessions');
  const now = new Date().toISOString();
  d.trainingSessions.push({
    id: sid, userId: req.user!.id, projectId: parseInt(projectId), topic, content: content || '',
    duration, status: 'completed', suggestion: JSON.stringify(suggestions), createdAt: now,
  });
  // Update progress
  const cat = project ? project.category : '技能训练';
  const existing = d.trainingProgress.find((tp: any) => tp.userId === req.user!.id && tp.category === cat);
  if (existing) {
    existing.percent = Math.min(100, existing.percent + 5);
    existing.updatedAt = now;
  } else {
    d.trainingProgress.push({ id: nextId('trainingProgress'), userId: req.user!.id, category: cat, percent: 5, updatedAt: now });
  }
  res.json({ success: true, data: { sessionId: sid, topic, duration, suggestions } });
});

router.get('/sessions', authMiddleware, (req: AuthRequest, res) => {
  const d = loadDb();
  const rows = d.trainingSessions.filter((s: any) => s.userId === req.user!.id)
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((s: any) => {
      const p = d.trainingProjects.find((tp: any) => tp.id === s.projectId);
      return { ...s, category: p?.category, difficulty: p?.difficulty };
    });
  res.json({ success: true, data: rows });
});

router.get('/progress', authMiddleware, (req: AuthRequest, res) => {
  const d = loadDb();
  const rows = d.trainingProgress.filter((tp: any) => tp.userId === req.user!.id);
  res.json({ success: true, data: rows });
});

export default router;
