const express = require('express');
const cors = require('cors');
const { FRONTEND_ORIGINS, PORT } = require('./config');

const app = express();

app.use(cors({
  origin(origin, callback) {
    if (!origin || FRONTEND_ORIGINS.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/assessment', require('./routes/assessment'));
app.use('/api/programs', require('./routes/programs'));
app.use('/api/training', require('./routes/training'));
app.use('/api/interview', require('./routes/interview'));

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Internship Accelerator API is running',
    time: new Date().toISOString(),
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API not found: ${req.method} ${req.path}`,
  });
});

app.use((err, req, res, next) => {
  console.error('[Global Error]', err);
  res.status(500).json({
    success: false,
    message: 'Server error',
  });
});

app.listen(PORT, () => {
  console.log(`Internship Accelerator API running at http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
