/**
 * Simple file-based JSON database - no native dependencies needed
 * Data is persisted to a JSON file and loaded into memory
 */
import fs from 'fs';
import path from 'path';

const DB_FILE = process.env.DB_FILE || path.resolve(__dirname, '../data/db.json');

// Ensure data directory exists
const dataDir = path.dirname(DB_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Database schema
export interface DB {
  users: any[];
  assessments: any[];
  programs: any[];
  enrollments: any[];
  interviewQuestions: any[];
  interviewSessions: any[];
  trainingProjects: any[];
  trainingSessions: any[];
  trainingProgress: any[];
  certificates: any[];
  notifications: any[];
  chatMessages: any[];
  _sequences: Record<string, number>;
}

let db: DB | null = null;

export function loadDb(): DB {
  if (db) return db;
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      db = JSON.parse(raw);
      return db!;
    } catch {
      // corrupted, create new
    }
  }
  db = createEmptyDb();
  saveDb(db);
  return db;
}

export function saveDb(data: DB) {
  db = data;
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function createEmptyDb(): DB {
  return {
    users: [],
    assessments: [],
    programs: [],
    enrollments: [],
    interviewQuestions: [],
    interviewSessions: [],
    trainingProjects: [],
    trainingSessions: [],
    trainingProgress: [],
    certificates: [],
    notifications: [],
    chatMessages: [],
    _sequences: {},
  };
}

export function nextId(table: string): number {
  const d = loadDb();
  d._sequences[table] = (d._sequences[table] || 0) + 1;
  saveDb(d);
  return d._sequences[table];
}

export function initDb() {
  const d = loadDb();
  const now = new Date().toISOString();

  // Seed programs
  if (d.programs.length === 0) {
    d.programs = [
      { id: nextId('programs'), level: '入门级', name: '入门加速方案', price: 999, duration: '3个月', features: ['职业规划指导','基础技能培训','简历制作指导','模拟面试1次','实习岗位推荐'], description: '适合刚开始准备实习的学生，包含基础的职业规划指导和技能培训', image: '/program-starter.png', createdAt: now },
      { id: nextId('programs'), level: '进阶级', name: '进阶提升方案', price: 1999, duration: '6个月', features: ['职业规划指导','专业技能培训','简历制作指导','模拟面试3次','实习岗位推荐','导师一对一指导'], description: '适合有一定基础的学生，提供更深入的专业技能培训和个性化指导', image: '/program-advanced.png', createdAt: now },
      { id: nextId('programs'), level: '专家级', name: '专家直通方案', price: 2999, duration: '12个月', features: ['职业规划指导','高级技能培训','简历制作指导','模拟面试5次','实习岗位推荐','导师一对一指导','企业实习内推'], description: '适合希望获得优质实习机会的学生，提供全面的技能培训和企业资源对接', image: '/program-expert.png', createdAt: now },
    ];
  }

  // Seed interview questions
  if (d.interviewQuestions.length === 0) {
    d.interviewQuestions = [
      { id: nextId('iq'), question: '请做一个自我介绍', answer: '您好，我叫[姓名]，是[学校]的[专业]学生。我具备[核心技能]，曾在[经历]中积累了[能力]经验。我应聘这个岗位是因为[原因]，希望能为贵公司做出贡献。', category: '自我介绍', frequency: '必问', type: '通用', tags: '自我介绍,开场', createdAt: now },
      { id: nextId('iq'), question: '为什么选择我们公司？', answer: '我了解贵公司在[行业]领域的领先地位，特别是[具体业务/产品]让我印象深刻。贵公司的[企业文化/价值观]与我的职业理念高度契合。我相信在这里可以获得最好的成长平台。', category: '动机类', frequency: '高频', type: '通用', tags: '动机,公司选择', createdAt: now },
      { id: nextId('iq'), question: '你的优势是什么？', answer: '我的核心优势有三个：第一，[专业技能优势]；第二，[软实力优势，如沟通协作]；第三，[个人特质优势，如学习能力强]。在[具体事例]中，这些优势帮助我取得了[成果]。', category: '自我认知', frequency: '必问', type: '通用', tags: '优势,自我认知', createdAt: now },
      { id: nextId('iq'), question: '你的职业规划是什么？', answer: '短期目标（1-2年）：在[岗位]上扎实基础，成为团队中可以独当一面的成员。中期目标（3-5年）：向[方向]发展，能够带领小团队完成项目。长期目标：成为[领域]的专家，为行业发展做出贡献。', category: '职业规划', frequency: '高频', type: '通用', tags: '规划,职业发展', createdAt: now },
      { id: nextId('iq'), question: '如何处理工作压力？', answer: '我会从三个层面应对压力：首先，合理规划时间，使用四象限法则区分任务优先级；其次，保持运动和良好的作息，确保身心状态；最后，遇到困难时主动与上级沟通，寻求团队支持。', category: '情景类', frequency: '常见', type: '通用', tags: '压力,情绪管理', createdAt: now },
      { id: nextId('iq'), question: '描述一次团队合作经历', answer: '在[项目]中，我担任[角色]。团队遇到了[困难]，我主动[行动]，协调[资源]，最终我们[成果]，提前[时间]完成任务。这次经历让我深刻理解了沟通和协作的重要性。', category: '行为面试', frequency: '常见', type: '通用', tags: '团队合作,STAR', createdAt: now },
      { id: nextId('iq'), question: '你为什么选择这个岗位？', answer: '这个岗位与我的专业背景和职业兴趣高度匹配。我具备[技能1]和[技能2]，这正是岗位要求的。同时，我对[领域]充满热情，希望在这个方向上深耕发展。', category: '动机类', frequency: '高频', type: '通用', tags: '岗位选择,动机', createdAt: now },
    ];
  }

  // Seed training projects
  if (d.trainingProjects.length === 0) {
    d.trainingProjects = [
      { id: nextId('tp'), title: 'JavaScript基础强化', description: '巩固JavaScript核心概念，包括变量、函数、对象、数组等基础知识点', category: '技能训练', duration: '60分钟', difficulty: '初级', content: '1. 变量和数据类型\n2. 函数定义和调用\n3. 对象和数组操作\n4. 条件语句和循环\n5. 错误处理', image: '/training-coding.png', createdAt: now },
      { id: nextId('tp'), title: '前端框架实践', description: '学习React或Vue等前端框架的基本使用方法', category: '技能训练', duration: '120分钟', difficulty: '中级', content: '1. 框架核心概念\n2. 组件开发\n3. 状态管理\n4. 路由配置\n5. 项目实战', image: '/training-coding.png', createdAt: now },
      { id: nextId('tp'), title: '算法与数据结构', description: '学习常见的算法和数据结构，提高编程能力', category: '技能训练', duration: '90分钟', difficulty: '高级', content: '1. 数组和链表\n2. 栈和队列\n3. 树和图\n4. 排序算法\n5. 搜索算法', image: '/training-coding.png', createdAt: now },
      { id: nextId('tp'), title: '后端开发基础', description: '学习Node.js或Python等后端开发技术', category: '技能训练', duration: '180分钟', difficulty: '中级', content: '1. 服务器搭建\n2. 数据库操作\n3. API设计\n4. 认证授权\n5. 部署上线', image: '/training-coding.png', createdAt: now },
      { id: nextId('tp'), title: '英语口语练习', description: '提高日常英语交流能力，为面试做准备', category: '语言训练', duration: '30分钟', difficulty: '初级', content: '1. 自我介绍\n2. 职业相关对话\n3. 常见面试问题\n4. 发音纠正\n5. 流畅度训练', image: '/training-language.png', createdAt: now },
      { id: nextId('tp'), title: '商务英语写作', description: '学习撰写专业的商务邮件和文档', category: '语言训练', duration: '60分钟', difficulty: '中级', content: '1. 邮件格式\n2. 正式表达\n3. 专业术语\n4. 沟通技巧\n5. 实例练习', image: '/training-language.png', createdAt: now },
      { id: nextId('tp'), title: '技术英语', description: '掌握IT行业相关的英语词汇和表达', category: '语言训练', duration: '90分钟', difficulty: '高级', content: '1. 技术文档阅读\n2. 专业术语\n3. 技术演讲\n4. 国际会议交流\n5. 案例分析', image: '/training-language.png', createdAt: now },
      { id: nextId('tp'), title: '沟通技巧提升', description: '提高职场沟通能力，包括口头和书面沟通', category: '软技能训练', duration: '60分钟', difficulty: '初级', content: '1. 有效倾听\n2. 表达技巧\n3. 非语言沟通\n4. 冲突解决\n5. 团队协作', image: '/training-softskill.png', createdAt: now },
      { id: nextId('tp'), title: '领导力培养', description: '学习基本的领导技能和团队管理方法', category: '软技能训练', duration: '90分钟', difficulty: '中级', content: '1. 团队建设\n2. 目标设定\n3. 激励方法\n4. 决策制定\n5. 反馈技巧', image: '/training-softskill.png', createdAt: now },
      { id: nextId('tp'), title: '时间管理', description: '学习高效的时间管理方法，提高工作效率', category: '软技能训练', duration: '30分钟', difficulty: '初级', content: '1. 优先级设定\n2. 计划制定\n3. 专注技巧\n4. 避免拖延\n5. 工作生活平衡', image: '/training-softskill.png', createdAt: now },
      { id: nextId('tp'), title: '演讲与展示', description: '提高公众演讲和展示能力', category: '软技能训练', duration: '120分钟', difficulty: '高级', content: '1. 内容组织\n2. 表达技巧\n3. 肢体语言\n4. 互动技巧\n5. 实例演练', image: '/training-softskill.png', createdAt: now },
    ];
  }

  // Seed default user
  if (d.users.length === 0) {
    const bcrypt = require('bcryptjs');
    const hashedPw = bcrypt.hashSync('123456', 10);
    const userId = nextId('users');
    d.users.push({
      id: userId, account: '13800138000', password: hashedPw, identity: 'student',
      name: '张同学', school: '北京大学', major: '计算机科学与技术',
      phone: '13800138000', email: 'zhang@pku.edu.cn', avatar: '/student-avatar-1.png',
      skillProfessional: '初级', skillLanguage: '中级', skillSoft: '高级',
      createdAt: now, updatedAt: now,
    });

    // Seed assessments for default user
    d.assessments.push(
      { id: nextId('assessments'), userId, major: '计算机科学与技术', skillLevel: '中级', experience: '曾在字节跳动实习3个月', careerGoal: '技术岗', matchPercent: 85, scoreProfessional: 88, scorePractical: 72, scoreCommunication: 80, scoreTeamwork: 85, scoreInnovation: 78, suggestions: JSON.stringify(['建议加强专业技能的深度学习','多参与团队项目，提升协作与沟通能力','关注行业动态，培养创新思维','考虑选择进阶级培养方案']), createdAt: '2026-03-10T10:00:00Z' },
      { id: nextId('assessments'), userId, major: '计算机科学与技术', skillLevel: '初级', experience: '无实习经历', careerGoal: '技术岗', matchPercent: 72, scoreProfessional: 70, scorePractical: 55, scoreCommunication: 75, scoreTeamwork: 80, scoreInnovation: 65, suggestions: JSON.stringify(['建议从入门方案开始系统学习','先完成基础技能训练','积累项目经验后再考虑进阶']), createdAt: '2026-02-25T10:00:00Z' },
      { id: nextId('assessments'), userId, major: '计算机科学与技术', skillLevel: '中级', experience: '参与了2个课程项目', careerGoal: '技术岗', matchPercent: 78, scoreProfessional: 82, scorePractical: 68, scoreCommunication: 78, scoreTeamwork: 80, scoreInnovation: 70, suggestions: JSON.stringify(['加强实践能力的培养','参与更多实战项目','提升算法和数据结构能力']), createdAt: '2026-01-15T10:00:00Z' }
    );

    // Seed training sessions
    d.trainingSessions.push(
      { id: nextId('ts'), userId, projectId: 1, topic: 'JavaScript基础强化', content: '完成了变量、函数、对象的学习', duration: '60分钟', status: 'completed', suggestion: JSON.stringify(['建议继续深入学习ES6+新特性','多写代码巩固基础','尝试用所学知识实现一个小项目']), createdAt: '2026-03-10T14:00:00Z' },
      { id: nextId('ts'), userId, projectId: 5, topic: '英语口语练习', content: '完成了自我介绍和常见面试问题练习', duration: '30分钟', status: 'completed', suggestion: JSON.stringify(['坚持每天练习15分钟','模仿native speaker的发音','不要害怕犯错']), createdAt: '2026-03-08T10:00:00Z' },
      { id: nextId('ts'), userId, projectId: 8, topic: '沟通技巧提升', content: '学习了有效倾听和表达技巧', duration: '60分钟', status: 'completed', suggestion: JSON.stringify(['沟通是双向的，学会倾听','注意非语言信号','在冲突中保持冷静']), createdAt: '2026-03-05T16:00:00Z' },
      { id: nextId('ts'), userId, projectId: 3, topic: '算法与数据结构', content: '学习了数组、链表、栈和队列', duration: '90分钟', status: 'in_progress', suggestion: JSON.stringify(['建议先掌握基础数据结构','每天刷1-2道算法题','理解算法原理比死记代码更重要']), createdAt: '2026-03-01T09:00:00Z' }
    );

    // Seed training progress
    d.trainingProgress.push(
      { id: nextId('tprog'), userId, category: '技能训练', percent: 60, updatedAt: now },
      { id: nextId('tprog'), userId, category: '语言训练', percent: 40, updatedAt: now },
      { id: nextId('tprog'), userId, category: '软技能训练', percent: 80, updatedAt: now }
    );

    // Seed certificates
    d.certificates.push(
      { id: nextId('certs'), userId, title: 'Web前端开发基础证书', issuer: '实习加速器', certDate: '2026-02-28', certNo: 'SXA20260228001', image: '/cert-template.png', createdAt: now },
      { id: nextId('certs'), userId, title: '面试技巧认证', issuer: '实习加速器', certDate: '2026-03-05', certNo: 'SXA20260305002', image: '/cert-template.png', createdAt: now }
    );

    // Seed notifications
    d.notifications.push(
      { id: nextId('notif'), userId, title: '新的实习岗位推荐', content: '为您推荐了4个新实习岗位：腾讯前端开发实习生(300-400元/天)、阿里巴巴Java后端开发实习生(350-450元/天)、字节跳动产品运营实习生(250-350元/天)、百度数据分析师实习生(300-400元/天)', type: '实习推荐', isRead: 0, actionType: 'jobs', actionData: '{"count":4}', createdAt: '2026-06-04T08:00:00Z' },
      { id: nextId('notif'), userId, title: '训练计划已更新', content: '新增了"前端框架实践"和"算法与数据结构"训练项目，更新了商务英语写作内容', type: '训练计划', isRead: 0, actionType: 'training', actionData: '{"newProjects":2}', createdAt: '2026-06-03T10:00:00Z' },
      { id: nextId('notif'), userId, title: '面试邀请', content: '腾讯 - 前端开发工程师，面试时间：2026-03-20 14:00-15:30，线上面试', type: '面试邀请', isRead: 0, actionType: 'interview', actionData: '{"company":"腾讯","position":"前端开发工程师"}', createdAt: '2026-06-01T09:00:00Z' },
      { id: nextId('notif'), userId, title: '技能测评结果', content: '您的技能测评已出炉：专业知识85%、实践能力70%、沟通能力90%、团队协作80%、创新能力75%', type: '测评结果', isRead: 0, actionType: 'assessment', actionData: '{"scores":{"professional":85,"practical":70,"communication":90,"teamwork":80,"innovation":75}}', createdAt: '2026-05-28T14:00:00Z' },
      { id: nextId('notif'), userId, title: '系统维护通知', content: '平台将于本周日凌晨2:00-4:00进行系统维护，期间部分功能可能不可用', type: '系统', isRead: 1, actionType: null, actionData: null, createdAt: '2026-05-20T10:00:00Z' }
    );
  }

  saveDb(d);
  console.log('Database initialized with seed data');
}

export default loadDb;
