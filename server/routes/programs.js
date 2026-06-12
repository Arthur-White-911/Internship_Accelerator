const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

function formatProgram(row) {
  return {
    id: row.id,
    level: row.level,
    price: Number(row.price),
    duration: row.duration || '',
    image: row.image || '/program-starter.png',
    description: row.description || '',
    features: db.parseJson(row.features, []),
    createdAt: db.toIso(row.created_at),
  };
}

router.get('/', async (req, res) => {
  try {
    const rows = await db.query('SELECT * FROM programs ORDER BY FIELD(level, ?, ?, ?)', [
      '初级',
      '中级',
      '高级',
    ]);
    return res.json({ success: true, data: rows.map(formatProgram) });
  } catch (err) {
    console.error('[programs list]', err);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/my/enrollments', authMiddleware, async (req, res) => {
  try {
    const rows = await db.query(
      `SELECT pe.id AS enrollment_id, pe.status, pe.enrolled_at, p.*
       FROM program_enrollments pe
       JOIN programs p ON p.id = pe.program_id
       WHERE pe.user_id = ?
       ORDER BY pe.enrolled_at DESC`,
      [req.userId]
    );
    const data = rows.map((row) => ({
      id: row.enrollment_id,
      status: row.status,
      enrolledAt: db.toIso(row.enrolled_at),
      program: formatProgram(row),
    }));
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[program enrollments]', err);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const row = await db.one('SELECT * FROM programs WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ success: false, message: '培养方案不存在' });
    return res.json({ success: true, data: formatProgram(row) });
  } catch (err) {
    console.error('[program detail]', err);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/:id/enroll', authMiddleware, async (req, res) => {
  try {
    const program = await db.one('SELECT * FROM programs WHERE id = ?', [req.params.id]);
    if (!program) return res.status(404).json({ success: false, message: '培养方案不存在' });

    await db.run(
      `INSERT INTO program_enrollments (user_id, program_id)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE status = 'active'`,
      [req.userId, req.params.id]
    );
    await db.insert(
      `INSERT INTO notifications (user_id, type, title, content)
       VALUES (?, ?, ?, ?)`,
      [
        req.userId,
        '训练计划',
        '培养方案报名成功',
        `你已报名${program.level}培养方案，可以开始按计划训练了。`,
      ]
    );

    return res.json({ success: true, message: '报名成功', data: formatProgram(program) });
  } catch (err) {
    console.error('[program enroll]', err);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
