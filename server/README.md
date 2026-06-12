# Internship Accelerator — 后端服务

基于 **Node.js + Express + NeDB** 的轻量级后端 API 服务。

## 技术栈

| 技术 | 用途 |
| --- | --- |
| Express | Web 框架 |
| NeDB | 嵌入式文档数据库（无需安装，数据存为本地文件） |
| bcryptjs | 密码加密 |
| jsonwebtoken | JWT 身份认证 |
| cors | 跨域处理 |

## 快速启动

```bash
cd server
npm install
node index.js
```

服务默认运行在 `http://localhost:3001`。

## 接口列表

### 认证（无需登录）

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/auth/register` | 注册 |
| POST | `/api/auth/login` | 登录 |

### 需要登录（请求头携带 `Authorization: Bearer <token>`）

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/auth/me` | 获取当前用户信息 |
| PUT | `/api/auth/profile` | 更新用户资料 |
| PUT | `/api/auth/password` | 修改密码 |
| GET | `/api/profile` | 获取个人资料 |
| PUT | `/api/profile` | 更新个人资料 |
| GET | `/api/notifications` | 获取通知列表 |
| GET | `/api/notifications/stats` | 获取未读数量 |
| PUT | `/api/notifications/:id/read` | 标记已读 |
| PUT | `/api/notifications/read-all` | 全部已读 |
| DELETE | `/api/notifications/:id` | 删除通知 |
| POST | `/api/chat/send` | 发送消息（AI 回复） |
| GET | `/api/chat/history` | 获取对话历史 |
| DELETE | `/api/chat/clear` | 清空对话 |
| POST | `/api/assessment/submit` | 提交能力测评 |
| GET | `/api/assessment/history` | 测评历史 |
| GET | `/api/assessment/latest` | 最新测评结果 |

## 环境变量（可选）

在 `server/` 目录下创建 `.env` 文件：

```env
PORT=3001
JWT_SECRET=your_custom_secret_key
OPENAI_API_KEY=your_openai_api_key
OPENAI_API_BASE=https://api.openai.com/v1
```

## 数据存储

所有数据存储在 `server/data/` 目录下的 `.db` 文件中（NeDB 格式，实为 JSON 文本），已加入 `.gitignore`，不会被提交到 Git。
