const express = require('express');
const cors = require('cors');
const { PORT } = require('./config');

const app = express();

// ─── 中间件 ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:4173',
    'http://127.0.0.1:5173',
    'https://internship-accelerator.netlify.app',
    'https://internshipaccelerator.netlify.app',
  ],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── 路由 ──────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/assessment', require('./routes/assessment'));
app.use('/api/interview', require('./routes/interview'));
app.use('/api/programs', require('./routes/programs'));
app.use('/api/training', require('./routes/training'));

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Internship Accelerator API is running', time: new Date().toISOString() });
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({ success: false, message: `接口不存在: ${req.method} ${req.path}` });
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('[Global Error]', err);
  res.status(500).json({ success: false, message: '服务器内部错误' });
});

// ─── 启动 ──────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Internship Accelerator API Server`);
  console.log(`   运行地址: http://localhost:${PORT}`);
  console.log(`   健康检查: http://localhost:${PORT}/api/health`);
  console.log(`   环境: ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;
