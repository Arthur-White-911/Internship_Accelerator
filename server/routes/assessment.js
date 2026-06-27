const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// ─── DeepSeek AI 调用工具函数 ─────────────────────────────────────────────
async function callDeepSeek(messages, options = {}) {
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
      max_tokens: options.max_tokens || 1200,
      temperature: options.temperature || 0.6,
      response_format: options.json_mode ? { type: 'json_object' } : undefined,
    }),
  });

  const data = await response.json();
  if (!data.choices || !data.choices[0]) {
    console.error('[DeepSeek assessment response]', JSON.stringify(data));
    throw new Error('DeepSeek 接口返回异常');
  }
  return data.choices[0].message.content;
}

// ─── POST /api/assessment/submit ──────────────────────────────────────────
router.post('/submit', authMiddleware, async (req, res) => {
  try {
    const { major, skillLevel, experience, careerGoal } = req.body;

    if (!major || !skillLevel || !careerGoal) {
      return res.status(400).json({ success: false, message: '请填写完整信息' });
    }

    // ── 构造 AI 评估 Prompt ──────────────────────────────────────────────
    const systemPrompt = `你是一位资深的职业能力评估专家，专注于大学生实习求职领域。
你的任务是根据学生填写的信息，对其求职竞争力进行客观、专业的多维度评估。
请严格按照要求的 JSON 格式输出，不要输出任何 JSON 以外的内容。`;

    const userPrompt = `请对以下大学生的求职能力进行深度评估，并以 JSON 格式返回结果。

【学生信息】
- 专业/方向：${major}
- 自评技能水平：${skillLevel}
- 实习/项目经历：${experience || '暂无'}
- 求职目标：${careerGoal}

【评估要求】
请从以下五个维度对该学生进行评分（0-100分），并结合其专业背景、技能水平和求职目标给出个性化分析：
1. professional（专业知识）：专业理论基础与行业知识储备
2. practical（实践能力）：项目经验、动手能力与工具掌握程度
3. communication（沟通能力）：表达、汇报与人际沟通潜力
4. teamwork（团队协作）：协作意识、跨部门配合能力
5. innovation（创新能力）：问题解决思路、创新思维与学习能力

同时计算 matchPercent（0-100），代表该学生与其求职目标岗位的综合匹配度。

最后给出3-5条具体、可执行的求职提升建议（suggestions），每条建议需针对该学生的具体情况，而非泛泛而谈。

【输出格式】（严格遵守，仅输出 JSON）
{
  "matchPercent": <number>,
  "scores": {
    "professional": <number>,
    "practical": <number>,
    "communication": <number>,
    "teamwork": <number>,
    "innovation": <number>
  },
  "suggestions": [
    "<具体建议1>",
    "<具体建议2>",
    "<具体建议3>"
  ]
}`;

    // ── 调用 DeepSeek 进行 AI 评估 ───────────────────────────────────────
    let scores, matchPercent, suggestions;

    try {
      const rawContent = await callDeepSeek(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        { max_tokens: 1200, temperature: 0.6, json_mode: true }
      );

      // 解析 JSON 结果
      const parsed = JSON.parse(rawContent);

      // 校验并提取字段，防止 AI 返回格式异常
      matchPercent = Math.min(100, Math.max(0, Math.round(Number(parsed.matchPercent) || 70)));
      scores = {
        professional: Math.min(100, Math.max(0, Math.round(Number(parsed.scores?.professional) || 60))),
        practical:    Math.min(100, Math.max(0, Math.round(Number(parsed.scores?.practical)    || 60))),
        communication:Math.min(100, Math.max(0, Math.round(Number(parsed.scores?.communication)|| 60))),
        teamwork:     Math.min(100, Math.max(0, Math.round(Number(parsed.scores?.teamwork)     || 60))),
        innovation:   Math.min(100, Math.max(0, Math.round(Number(parsed.scores?.innovation)   || 60))),
      };
      suggestions = Array.isArray(parsed.suggestions) && parsed.suggestions.length > 0
        ? parsed.suggestions.slice(0, 5).map(s => String(s))
        : ['建议结合目标岗位要求，针对性地补充相关技能与项目经验。'];

    } catch (aiErr) {
      // AI 调用失败时的兜底逻辑（保留基础评分，避免接口报错）
      console.error('[assessment AI error]', aiErr.message);
      const levelMap = { '初级': 55, '中级': 68, '高级': 82 };
      const base = levelMap[skillLevel] || 62;
      const expBonus = experience && experience.length > 20 ? 5 : 0;
      matchPercent = Math.min(100, base + expBonus);
      scores = {
        professional:  Math.min(100, base + expBonus),
        practical:     Math.min(100, base + expBonus - 3),
        communication: Math.min(100, base + expBonus + 2),
        teamwork:      Math.min(100, base + expBonus + 4),
        innovation:    Math.min(100, base + expBonus - 2),
      };
      suggestions = ['AI 分析服务暂时不可用，请稍后重新提交以获取个性化建议。'];
    }

    // ── 持久化评估结果 ────────────────────────────────────────────────────
    const record = await db.assessments.insertAsync({
      userId: req.userId,
      major,
      skillLevel,
      experience: experience || '',
      careerGoal,
      matchPercent,
      scores,
      suggestions,
      createdAt: new Date().toISOString(),
    });

    // ── 触发通知 ──────────────────────────────────────────────────────────
    await db.notifications.insertAsync({
      userId: req.userId,
      type: 'assessment',
      title: '能力分析报告已生成',
      content: `你的岗位匹配度为 ${matchPercent} 分，快去查看详细报告和个性化建议吧！`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    return res.json({ success: true, data: record });
  } catch (err) {
    console.error('[assessment submit]', err);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// ─── 兼容旧版记录字段，确保所有记录都有前端期望的字段 ────────────────────
function normalizeRecord(r) {
  const safeNum = (v, fallback = 60) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.min(100, Math.max(0, Math.round(n))) : fallback;
  };

  // matchPercent: 新字段优先，兼容旧字段 overall
  const matchPercent = safeNum(
    r.matchPercent !== undefined ? r.matchPercent : r.overall,
    65
  );

  // scores: 新字段优先，兼容旧字段名（technical→professional, problemSolving→practical）
  const oldScores = r.scores || {};
  const scores = {
    professional:  safeNum(oldScores.professional  ?? oldScores.technical,     60),
    practical:     safeNum(oldScores.practical      ?? oldScores.problemSolving, 60),
    communication: safeNum(oldScores.communication,                              60),
    teamwork:      safeNum(oldScores.teamwork,                                   60),
    innovation:    safeNum(oldScores.innovation     ?? oldScores.creativity,     60),
  };

  const suggestions = Array.isArray(r.suggestions) && r.suggestions.length > 0
    ? r.suggestions
    : ['建议结合目标岗位要求，针对性地补充相关技能与项目经验。'];

  return { ...r, matchPercent, scores, suggestions };
}

// ─── GET /api/assessment/history ──────────────────────────────────────────
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const records = await db.assessments.findAsync({ userId: req.userId });
    records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.json({ success: true, data: records.map(normalizeRecord) });
  } catch (err) {
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// ─── GET /api/assessment/latest ───────────────────────────────────────────
router.get('/latest', authMiddleware, async (req, res) => {
  try {
    const records = await db.assessments.findAsync({ userId: req.userId });
    if (!records.length) return res.json({ success: true, data: null });
    records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.json({ success: true, data: normalizeRecord(records[0]) });
  } catch (err) {
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
