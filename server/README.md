# Internship Accelerator Backend

Backend API for the Internship Accelerator project. It uses Node.js, Express, MySQL, JWT auth, and DeepSeek for the chat assistant.

## Quick Start

1. Install dependencies:

```bash
cd server
npm install
```

2. Create MySQL tables:

```bash
mysql -u root -p < ../database/schema.sql
mysql -u root -p internship_accelerator < ../database/seed.sql
```

3. Create environment config:

```bash
cp .env.example .env
```

Then edit `.env` and fill in your MySQL password, JWT secret, frontend domain, and DeepSeek key.

4. Start the API:

```bash
npm run dev
```

The API runs at `http://localhost:3001` by default.

## Important Environment Variables

```env
PORT=3001
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=internship_accelerator
JWT_SECRET=replace_with_a_long_random_secret
FRONTEND_ORIGINS=http://localhost:5173,https://your-site.netlify.app
DEEPSEEK_API_KEY=your_deepseek_api_key
```

Never commit a real `DEEPSEEK_API_KEY` or database password.

## API Groups

Public:

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/health` | Health check |
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login |
| GET | `/api/programs` | List programs |
| GET | `/api/training/projects` | List training projects |
| GET | `/api/interview/questions` | List interview questions |

Requires `Authorization: Bearer <token>`:

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/auth/me` | Current user |
| PUT | `/api/auth/profile` | Update profile |
| PUT | `/api/auth/password` | Update password |
| GET/PUT | `/api/profile` | Profile center |
| POST | `/api/assessment/submit` | Submit assessment |
| GET | `/api/assessment/history` | Assessment history |
| POST | `/api/chat/send` | DeepSeek chat |
| GET/DELETE | `/api/chat/history` | Chat history |
| POST | `/api/programs/:id/enroll` | Enroll program |
| POST | `/api/training/start` | Start training |
| GET | `/api/interview/history` | Mock interview history |
| POST | `/api/interview/mock` | Submit mock interview |
| GET/PUT/DELETE | `/api/notifications` | Notifications |

## Deployment Notes

Deploy the frontend separately on Netlify. Set this Netlify environment variable:

```env
VITE_API_BASE=https://your-backend-domain.com/api
```

Deploy this `server/` folder on a Node backend platform such as Render, Railway, a VPS, or a cloud server. The backend must be able to connect to your MySQL instance.
