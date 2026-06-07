import express from 'express';
import cors from 'cors';
import path from 'path';
import { initDb } from './db-simple';

import authRoutes from './routes/auth';
import assessmentRoutes from './routes/assessment';
import programsRoutes from './routes/programs';
import interviewRoutes from './routes/interview';
import trainingRoutes from './routes/training';
import chatRoutes from './routes/chat';
import profileRoutes from './routes/profile';
import notificationsRoutes from './routes/notifications';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:4173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.resolve(__dirname, '../../app/dist')));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/assessment', assessmentRoutes);
app.use('/api/programs', programsRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/notifications', notificationsRoutes);

// Serve frontend SPA
app.get('*', (_req, res) => {
  res.sendFile(path.resolve(__dirname, '../../app/dist/index.html'));
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ success: false, message: '服务器内部错误' });
});

// Initialize and start
initDb();
app.listen(PORT, () => {
  console.log(`
====================================================
  实习加速器 API 服务已启动
  端口: ${PORT}
  数据存储: JSON 文件 (data/db.json)
  
  核心接口:
  POST /api/auth/login         登录
  POST /api/auth/register      注册
  GET  /api/auth/me            当前用户
  PUT  /api/auth/profile       更新资料
  PUT  /api/auth/password      修改密码
  
  POST /api/assessment/submit  提交测评
  GET  /api/assessment/history 测评历史
  GET  /api/assessment/latest  最新测评
  
  GET  /api/programs           方案列表
  GET  /api/programs/:id       方案详情
  POST /api/programs/:id/enroll 报名
  GET  /api/programs/my/enrollments 我的报名
  
  GET  /api/interview/questions 面试题库
  GET  /api/interview/questions/:id 题目详情
  POST /api/interview/mock     模拟面试
  GET  /api/interview/history  面试历史
  
  GET  /api/training/projects  训练项目
  GET  /api/training/projects/:id 项目详情
  POST /api/training/start     开始训练
  GET  /api/training/sessions  训练记录
  GET  /api/training/progress  训练进度
  
  POST /api/chat/send          发送消息
  GET  /api/chat/history       聊天记录
  DELETE /api/chat/history     清空记录
  
  GET  /api/profile            个人信息
  PUT  /api/profile            更新信息
  GET  /api/profile/training-records 训练记录
  GET  /api/profile/certificates 证书列表
  
  GET  /api/notifications      通知列表
  GET  /api/notifications/stats 通知统计
  PUT  /api/notifications/:id/read 标记已读
  PUT  /api/notifications/read-all 全部已读
  DELETE /api/notifications/:id 删除通知
====================================================
`);
});
