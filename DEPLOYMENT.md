# Deployment Checklist

## Frontend on Netlify

Use these settings:

```txt
Build command: npm run build
Publish directory: dist
```

Environment variables:

```env
NODE_VERSION=22.12.0
VITE_API_BASE=https://your-backend-domain.com/api
```

## MySQL

Create the database and tables:

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p internship_accelerator < database/seed.sql
```

## Backend

Deploy the `server/` folder to a Node.js host.

Required environment variables:

```env
PORT=3001
DB_HOST=your_mysql_host
DB_PORT=3306
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=internship_accelerator
JWT_SECRET=replace_with_a_long_random_secret
FRONTEND_ORIGINS=https://your-site.netlify.app
DEEPSEEK_API_KEY=your_deepseek_api_key
```

After backend deployment, open:

```txt
https://your-backend-domain.com/api/health
```

If it returns `success: true`, update Netlify's `VITE_API_BASE` with the backend `/api` URL and redeploy the frontend.
