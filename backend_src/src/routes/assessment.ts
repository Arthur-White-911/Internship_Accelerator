import { Router } from 'express';
import { loadDb, nextId } from '../db-simple';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/submit', authMiddleware, (req: AuthRequest, res) => {
  try {
    const { major, skillLevel, experience, careerGoal } = req.body;
    const userId = req.user!.id;
    const matchPercent = Math.floor(70 + Math.random() * 25);
    const scores = {
      professional: Math.floor(70 + Math.random() * 25),
      practical: Math.floor(60 + Math.random() * 30),
      communication: Math.floor(65 + Math.random() * 30),
      teamwork: Math.floor(70 + Math.random() * 25),
      innovation: Math.floor(60 + Math.random() * 30),
    };
    const suggestionSets: Record<string, string[]> = {
      '技术岗': ['建议加强专业技能的深度学习','多参与团队项目提升协作能力','关注行业动态培养创新思维','考虑选择进阶级培养方案'],
      '管理岗': ['建议多参与学生组织和社团活动','培养全局视野和战略思维能力','提升沟通协调能力','考虑选择进阶级培养方案'],
      '市场岗': ['建议关注市场趋势和消费者行为研究','培养数据分析和洞察能力','多参加市场调研项目'],
      '财务岗': ['建议加强财务分析和建模能力','考取相关职业资格证书','关注金融市场动态'],
    };
    const suggestions = suggestionSets[careerGoal] || suggestionSets['技术岗'];
    const d = loadDb();
    const id = nextId('assessments');
    const now = new Date().toISOString();
    d.assessments.push({
      id, userId, major, skillLevel, experience: experience || '', careerGoal,
      matchPercent, scoreProfessional: scores.professional, scorePractical: scores.practical,
      scoreCommunication: scores.communication, scoreTeamwork: scores.teamwork,
      scoreInnovation: scores.innovation, suggestions: JSON.stringify(suggestions), createdAt: now,
    });
    res.json({ success: true, data: { id, matchPercent, scores, suggestions, createdAt: now } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/history', authMiddleware, (req: AuthRequest, res) => {
  try {
    const d = loadDb();
    const rows = d.assessments
      .filter((a: any) => a.userId === req.user!.id)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((r: any) => ({
        id: r.id, major: r.major, skillLevel: r.skillLevel, careerGoal: r.careerGoal,
        matchPercent: r.matchPercent,
        scores: { professional: r.scoreProfessional, practical: r.scorePractical, communication: r.scoreCommunication, teamwork: r.scoreTeamwork, innovation: r.scoreInnovation },
        suggestions: JSON.parse(r.suggestions || '[]'), createdAt: r.createdAt,
      }));
    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/latest', authMiddleware, (req: AuthRequest, res) => {
  try {
    const d = loadDb();
    const rows = d.assessments
      .filter((a: any) => a.userId === req.user!.id)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (rows.length === 0) { res.json({ success: true, data: null }); return; }
    const r = rows[0];
    res.json({
      success: true,
      data: { id: r.id, major: r.major, skillLevel: r.skillLevel, careerGoal: r.careerGoal, matchPercent: r.matchPercent,
        scores: { professional: r.scoreProfessional, practical: r.scorePractical, communication: r.scoreCommunication, teamwork: r.scoreTeamwork, innovation: r.scoreInnovation },
        suggestions: JSON.parse(r.suggestions || '[]'), createdAt: r.createdAt, },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
