const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const { DEEPSEEK_API_KEY } = require('../config');

const router = express.Router();

function formatMessage(row) {
  return {
    id: row.id,
    role: row.role,
    content: row.content,
    createdAt: db.toIso(row.created_at),
  };
}

async function askDeepSeek(messages) {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY is not configured');
  }

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      max_tokens: 800,
      temperature: 0.7,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error?.message || `DeepSeek HTTP ${response.status}`);
  }
  if (!data.choices?.[0]?.message?.content) {
    throw new Error('DeepSeek returned an empty response');
  }
  return data.choices[0].message.content;
}

router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: '消息不能为空' });
    }

    const history = await db.query(
      `SELECT role, content FROM chat_messages
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 10`,
      [req.userId]
    );

    const messages = [
      {
        role: 'system',
        content:
          '你是一位专业的求职导师，帮助大学生准备实习和校招。请用简洁、友好、专业的中文回答，控制在300字以内。',
      },
      ...history.reverse().map((item) => ({
        role: item.role === 'ai' ? 'assistant' : 'user',
        content: item.content,
      })),
      { role: 'user', content: message.trim() },
    ];

    let reply;
    let suggestions = [];
    try {
      reply = await askDeepSeek(messages);
    } catch (aiErr) {
      console.error('[DeepSeek chat error]', aiErr.message);
      reply = '抱歉，AI 服务暂时不可用。你可以先查看面试题库、训练计划或培养方案，我也建议稍后再试。';
      suggestions = ['检查 DEEPSEEK_API_KEY 是否已配置', '稍后重试', '先查看面试题库'];
    }

    await db.insert(
      'INSERT INTO chat_messages (user_id, role, content) VALUES (?, ?, ?)',
      [req.userId, 'user', message.trim()]
    );
    await db.insert(
      'INSERT INTO chat_messages (user_id, role, content) VALUES (?, ?, ?)',
      [req.userId, 'ai', reply]
    );

    return res.json({
      success: true,
      data: {
        message: reply,
        timestamp: new Date().toISOString(),
        suggestions,
      },
    });
  } catch (err) {
    console.error('[chat send]', err);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/history', authMiddleware, async (req, res) => {
  try {
    const rows = await db.query(
      `SELECT * FROM chat_messages
       WHERE user_id = ?
       ORDER BY created_at ASC`,
      [req.userId]
    );
    return res.json({ success: true, data: rows.map(formatMessage) });
  } catch (err) {
    console.error('[chat history]', err);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

async function clearHistory(req, res) {
  try {
    await db.run('DELETE FROM chat_messages WHERE user_id = ?', [req.userId]);
    return res.json({ success: true, message: '对话已清空' });
  } catch (err) {
    console.error('[chat clear]', err);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
}

router.delete('/history', authMiddleware, clearHistory);
router.delete('/clear', authMiddleware, clearHistory);

module.exports = router;
