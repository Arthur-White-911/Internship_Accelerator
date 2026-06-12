const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// POST /api/chat/send
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: '消息不能为空' });
    }

    // 获取历史对话（最近10条）
    const history = await db.chatHistory.findAsync({ userId: req.userId });
    history.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const recent = history.slice(-10);

    // 构建消息列表
    const messages = [
      {
        role: 'system',
        content: `你是一位专业的求职导师，专门帮助在校大学生准备实习和校招。
你擅长：简历优化、面试技巧、职业规划、行业分析、岗位推荐。
请用简洁、友好、专业的中文回答，每次回复控制在300字以内。`,
      },
      ...recent.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: message },
    ];

    // 调用 DeepSeek AI 接口
    let reply = '';
    try {
      const deepseekKey = process.env.DEEPSEEK_API_KEY || 'sk-2b401ab6175e449ea8087884eb78e423';

      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${deepseekKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages,
          max_tokens: 800,
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      if (data.choices && data.choices[0]) {
        reply = data.choices[0].message.content;
      } else {
        console.error('[DeepSeek response]', JSON.stringify(data));
        throw new Error('DeepSeek 接口返回异常');
      }
    } catch (aiErr) {
      console.error('[chat AI error]', aiErr.message);
      reply = '抱歉，AI 服务暂时不可用，请稍后再试。如需帮助，可以查看我们的面试题库或培养方案。';
    }

    const now = new Date().toISOString();

    // 保存用户消息
    await db.chatHistory.insertAsync({
      userId: req.userId,
      role: 'user',
      content: message,
      createdAt: now,
    });

    // 保存 AI 回复
    await db.chatHistory.insertAsync({
      userId: req.userId,
      role: 'assistant',
      content: reply,
      createdAt: new Date(Date.now() + 1).toISOString(),
    });

    return res.json({ success: true, data: { reply } });
  } catch (err) {
    console.error('[chat send]', err);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// GET /api/chat/history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const history = await db.chatHistory.findAsync({ userId: req.userId });
    history.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    return res.json({ success: true, data: history });
  } catch (err) {
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// DELETE /api/chat/clear
router.delete('/clear', authMiddleware, async (req, res) => {
  try {
    await db.chatHistory.removeAsync({ userId: req.userId }, { multi: true });
    return res.json({ success: true, message: '对话已清空' });
  } catch (err) {
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
