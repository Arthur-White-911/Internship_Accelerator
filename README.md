<div align="center">

# 🚀 Internship Accelerator

**实习加速器 — 面向大学生的 AI 驱动求职成长平台**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

[功能介绍](#-核心功能) · [快速开始](#-快速开始) · [项目结构](#-项目结构) · [部署指南](#-部署指南)

</div>

---

## 📖 项目简介

**Internship Accelerator（实习加速器）** 是一款面向在校大学生的 AI 驱动求职成长平台。平台整合了职业能力分析、分级培养方案、AI 面试模拟、技能培训、智能求职咨询等核心模块，帮助学生系统性地提升求职竞争力，加速从校园到职场的过渡。

平台采用深空蓝 + 青色的科技感视觉风格，配合流畅的动画交互，为用户提供沉浸式的学习与求职体验。

---

## ✨ 核心功能

### 🧠 职业能力分析（Assessment）
填写基本信息、专业技能、实习经历与职业目标后，AI 将生成个性化的能力分析报告，涵盖技术岗、管理岗、市场岗、财务岗等多个方向，并给出初级 / 中级 / 高级的能力评级。

### 📋 分级培养方案（Programs）
提供入门、进阶、专家三个层级的系统培养方案，涵盖职业方向测评、能力分析报告、简历模板库、面试题库、社群答疑等配套资源，支持按需筛选与订阅。

### 🎤 AI 面试模拟（Interview）
内置技术面试、HR 面试、经理面试三大场景，覆盖必问、高频、常见三类题目。支持文字作答与 AI 实时评分反馈，帮助用户在正式面试前充分练习。

### 📚 技能培训（Training）
- **自主训练**：自由输入训练主题与目标，AI 生成专属训练计划，覆盖技术、语言、软技能三大方向。
- **录播课程**：提供互联网运营与数据分析导论课，系统建立职场基础认知。

### 💬 智能求职咨询（Chat）
AI 求职导师 7×24 小时在线，解答简历制作、面试技巧、职业规划、岗位选择等问题，支持多轮对话与历史记录。

### 👤 个人中心（Profile）
管理个人信息（姓名、学校、专业、联系方式）、技能标签（专业技能 / 语言能力 / 软技能）、学习进度与账号安全设置。

---

## 🛠 技术栈

| 类别 | 技术 |
| --- | --- |
| 前端框架 | React 19 + TypeScript 5.9 |
| 构建工具 | Vite 7 |
| 样式方案 | TailwindCSS 3 + tw-animate-css |
| UI 组件库 | Radix UI（全套无头组件） |
| 动画 | Framer Motion 12 + GSAP 3 + Lenis（平滑滚动） |
| 3D 渲染 | Three.js + @react-three/fiber + @react-three/drei |
| 路由 | React Router 7 |
| 表单 | React Hook Form + Zod |
| 图表 | Recharts |
| 图标 | Lucide React |
| 通知 | Sonner |

---

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- pnpm / npm / yarn

### 安装与启动

```bash
# 克隆仓库
git clone https://github.com/Arthur-White-911/Internship_Accelerator.git
cd Internship_Accelerator

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

浏览器访问 `http://localhost:5173` 即可预览。

### 常用命令

```bash
npm run dev      # 启动开发服务器（热更新）
npm run build    # 构建生产版本，输出至 dist/
npm run preview  # 本地预览生产构建结果
npm run lint     # 运行 ESLint 代码检查
```

---

## 📁 项目结构

```
Internship_Accelerator/
├── public/                  # 静态资源
├── src/
│   ├── components/          # 公共组件
│   │   ├── Layout.tsx       # 全局布局（Navbar + Footer）
│   │   ├── Navbar.tsx       # 顶部导航栏
│   │   ├── Footer.tsx       # 页脚
│   │   └── ui/              # Radix UI 封装组件库
│   ├── pages/               # 页面组件
│   │   ├── Home.tsx         # 首页
│   │   ├── Assessment.tsx   # 职业能力分析
│   │   ├── Programs.tsx     # 培养方案
│   │   ├── Interview.tsx    # AI 面试模拟
│   │   ├── Training.tsx     # 技能培训
│   │   ├── Chat.tsx         # 智能求职咨询
│   │   ├── Profile.tsx      # 个人中心
│   │   ├── Notifications.tsx# 通知中心
│   │   └── Auth.tsx         # 登录 / 注册
│   ├── hooks/               # 自定义 Hooks
│   │   ├── useAuth.tsx      # 用户认证状态管理
│   │   └── use-mobile.ts    # 移动端检测
│   ├── lib/
│   │   └── utils.ts         # 工具函数（cn 等）
│   ├── index.css            # 全局样式与 CSS 变量
│   ├── App.tsx              # 路由配置入口
│   └── main.tsx             # 应用挂载入口
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 🌐 部署指南

### 方案一：Vercel（推荐，免费）

1. 访问 [vercel.com](https://vercel.com) 并使用 GitHub 账号登录。
2. 点击 **Add New Project**，选择本仓库。
3. Framework 自动识别为 **Vite**，无需额外配置。
4. 点击 **Deploy** 即可完成部署，自动获得 HTTPS 域名。

> 每次 `git push` 到 `main` 分支将自动触发重新部署。

### 方案二：阿里云 OSS 静态托管

```bash
# 构建生产版本
npm run build
```

1. 在[阿里云 OSS 控制台](https://oss.console.aliyun.com)创建 Bucket，读写权限设为**公共读**。
2. 进入 **数据管理 → 静态页面**，将默认首页与 404 页面均设置为 `index.html`（React Router SPA 必需）。
3. 将 `dist/` 目录下的所有文件上传至 Bucket 根目录。
4. 访问 Bucket 域名即可。可进一步绑定自定义域名并接入 CDN 加速，月均费用约 ¥5–20。

### 方案三：GitHub Pages（免费）

由于 React Router 使用 HTML5 History API，需在 `public/` 目录下添加 `404.html`（内容与 `index.html` 相同）以处理刷新 404 问题。

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/your-feature`
3. 提交更改：`git commit -m 'feat: add your feature'`
4. 推送分支：`git push origin feature/your-feature`
5. 发起 Pull Request

---

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源。

---

<div align="center">
  <sub>Built with ❤️ by Arthur White</sub>
</div>
