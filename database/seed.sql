USE internship_accelerator;

INSERT INTO programs (level, price, duration, image, description, features)
SELECT '初级', 999.00, '4周', '/program-starter.png',
       '适合刚开始准备实习的学生，完成职业方向测评、简历基础打磨和入门训练。',
       JSON_ARRAY('职业方向测评', '基础能力分析报告', '简历模板库', '入门技能训练')
WHERE NOT EXISTS (SELECT 1 FROM programs WHERE level = '初级');

INSERT INTO programs (level, price, duration, image, description, features)
SELECT '中级', 1999.00, '8周', '/program-advanced.png',
       '适合已有目标岗位的学生，提供进阶训练、AI模拟面试和岗位推荐。',
       JSON_ARRAY('进阶能力分析报告', '录播+直播课程', 'AI模拟面试5次', '优先岗位推送')
WHERE NOT EXISTS (SELECT 1 FROM programs WHERE level = '中级');

INSERT INTO programs (level, price, duration, image, description, features)
SELECT '高级', 2999.00, '12周', '/program-expert.png',
       '适合冲刺高质量实习的学生，提供导师一对一指导、项目实战和面试保障。',
       JSON_ARRAY('深度能力分析报告', '1对1导师指导', '项目实战', '专属内推', '真人模拟面试')
WHERE NOT EXISTS (SELECT 1 FROM programs WHERE level = '高级');

INSERT INTO training_projects (title, description, category, duration, difficulty, content, image)
SELECT '前端项目实战训练', '围绕 React、组件设计和页面性能优化完成一次完整项目练习。', 'skill', '2小时', '中级',
       '完成一个可复用组件，并说明状态管理、交互细节和性能优化思路。', '/training-coding.png'
WHERE NOT EXISTS (SELECT 1 FROM training_projects WHERE title = '前端项目实战训练');

INSERT INTO training_projects (title, description, category, duration, difficulty, content, image)
SELECT '职场英语表达训练', '训练英文自我介绍、项目经历介绍和常见面试问答。', 'language', '1小时', '初级',
       '用英文完成 1 分钟自我介绍，并回答一个项目经历问题。', '/training-language.png'
WHERE NOT EXISTS (SELECT 1 FROM training_projects WHERE title = '职场英语表达训练');

INSERT INTO training_projects (title, description, category, duration, difficulty, content, image)
SELECT '团队协作情景训练', '模拟冲突处理、任务拆分和进度同步等职场软技能场景。', 'softskill', '1小时', '初级',
       '根据给定团队场景，写出沟通策略和执行计划。', '/training-softskill.png'
WHERE NOT EXISTS (SELECT 1 FROM training_projects WHERE title = '团队协作情景训练');

INSERT INTO interview_questions (question, category, frequency, answer, type, tags)
SELECT '请做一个1分钟的自我介绍', 'HR面试', '必问',
       '建议按照背景、能力、项目经历、求职目标四部分组织，突出和岗位匹配的经历。',
       '自我介绍', JSON_ARRAY('结构清晰', '控制时长', '突出匹配度')
WHERE NOT EXISTS (SELECT 1 FROM interview_questions WHERE question = '请做一个1分钟的自我介绍');

INSERT INTO interview_questions (question, category, frequency, answer, type, tags)
SELECT '请解释一下 React 虚拟 DOM 的工作原理及其优势', '技术面试', '高频',
       '虚拟 DOM 是对真实 DOM 的轻量描述。React 通过状态变化生成新树，经过 diff 找到变化，再批量更新真实 DOM。',
       '前端基础', JSON_ARRAY('React', 'Diff', '性能优化')
WHERE NOT EXISTS (SELECT 1 FROM interview_questions WHERE question = '请解释一下 React 虚拟 DOM 的工作原理及其优势');

INSERT INTO interview_questions (question, category, frequency, answer, type, tags)
SELECT '描述一次你与团队成员产生分歧的经历，你是如何处理的？', 'HR面试', '常见',
       '可以使用 STAR 法：说明背景、任务、行动和结果，重点突出沟通方式和复盘。',
       '团队协作', JSON_ARRAY('S:项目推进中出现方案分歧', 'T:需要达成一致并按期交付', 'A:拆解目标并组织讨论', 'R:按期完成并沉淀规范')
WHERE NOT EXISTS (SELECT 1 FROM interview_questions WHERE question = '描述一次你与团队成员产生分歧的经历，你是如何处理的？');
