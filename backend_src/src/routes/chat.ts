import { Router } from 'express';
import { loadDb, nextId } from '../db-simple';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

const knowledgeBase: { keywords: string[]; response: string }[] = [
  { keywords: ['简历','resume','cv'], response: '制作优秀简历的关键是突出与目标岗位的匹配度。建议：1.使用STAR法则描述项目经历；2.量化你的成果；3.保持一页纸原则；4.针对不同岗位定制简历内容。' },
  { keywords: ['面试','interview','面经'], response: '面试准备的核心是"了解自己、了解岗位、了解公司"。建议：1.提前研究公司业务和文化；2.用STAR法则准备至少5个故事；3.准备向面试官提问的问题；4.进行至少2次模拟面试练习。' },
  { keywords: ['规划','career','职业','发展'], response: '职业规划建议从三个维度思考：1.自我认知（兴趣、优势、价值观）；2.行业趋势（目标行业的发展前景）；3.阶段性目标。你可以先做一个职业能力测评，了解自己的优势和待提升点。' },
  { keywords: ['技术','前端','后端','开发','编程'], response: '技术岗面试准备建议：1.巩固计算机基础（数据结构、算法、网络、操作系统）；2.深入掌握1-2门编程语言；3.准备项目经验的详细描述；4.刷LeetCode至少100题；5.了解目标公司的技术栈。' },
  { keywords: ['自我介绍'], response: '自我介绍的黄金结构（1-2分钟）：1.开场问候；2.教育背景；3.核心经历/项目（用STAR法则）；4.与岗位的匹配点；5.结束语。记住要自信、简洁、有重点！' },
  { keywords: ['薪资','工资','salary','待遇'], response: '谈薪资的技巧：1.提前调研市场薪资范围；2.了解自己的底线和期望值；3.在对方提出数字前先不主动报价；4.考虑总包（base+bonus+福利）。' },
  { keywords: ['实习','intern','找实习'], response: '找实习的渠道：1.实习僧、BOSS直聘等平台；2.学校就业中心和校友网络；3.公司官网直接投递；4.技术社区和内推群。建议海投+精投结合。' },
  { keywords: ['算法','数据结构','刷题'], response: '算法学习路径：1.先掌握基础数据结构；2.再学基础算法；3.按类型刷LeetCode；4.每天1-2题，重在理解。需要推荐具体的刷题列表吗？' },
  { keywords: ['沟通','表达','软技能'], response: '提升沟通能力的方法：1.主动参与课堂讨论和社团活动；2.练习清晰表达观点；3.学会倾听和反馈；4.多进行演示和演讲练习。' },
  { keywords: ['焦虑','紧张','压力','害怕'], response: '求职焦虑是很正常的，每个人都在经历。建议：1.把大目标分解为小步骤；2.与同学朋友交流，互相鼓励；3.保持运动和充足睡眠；4.记住：找工作是一个匹配过程，不是评判你价值的标准。' },
];

function getAIResponse(message: string): string {
  const lowerMsg = message.toLowerCase();
  for (const item of knowledgeBase) {
    if (item.keywords.some(k => lowerMsg.includes(k))) return item.response;
  }
  const defaults = [
    '这是一个很好的问题！建议你可以从以下几个方面思考：明确目标、制定计划、持续行动。需要我针对你的具体情况给出更详细的建议吗？',
    '我理解你的困惑。在求职过程中，保持学习的心态和积极的行动非常重要。你可以告诉我更多细节，让我帮你分析。',
    '你的问题很有价值！每个人的情况不同，建议你先做一个全面的自我评估，然后针对性地准备。需要我推荐适合你的工具或资源吗？',
  ];
  return defaults[Math.floor(Math.random() * defaults.length)];
}

router.post('/send', authMiddleware, (req: AuthRequest, res) => {
  const { message } = req.body;
  const d = loadDb();
  const now = new Date().toISOString();
  d.chatMessages.push({ id: nextId('chatMessages'), userId: req.user!.id, role: 'user', content: message, createdAt: now });
  const aiResponse = getAIResponse(message);
  d.chatMessages.push({ id: nextId('chatMessages'), userId: req.user!.id, role: 'assistant', content: aiResponse, createdAt: now });
  res.json({ success: true, data: { message: aiResponse, timestamp: now } });
});

router.get('/history', authMiddleware, (req: AuthRequest, res) => {
  const d = loadDb();
  const rows = d.chatMessages
    .filter((m: any) => m.userId === req.user!.id)
    .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .slice(-50);
  res.json({ success: true, data: rows });
});

router.delete('/history', authMiddleware, (req: AuthRequest, res) => {
  const d = loadDb();
  d.chatMessages = d.chatMessages.filter((m: any) => m.userId !== req.user!.id);
  res.json({ success: true, message: '对话记录已清空' });
});

export default router;
