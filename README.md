# Task Management System

Full-stack Task Management System using Next.js, React, TypeScript, Node.js, Express, MongoDB and JWT authentication.

## Fixed startup / Internal Server Error

This version uses the REST API directly at `http://localhost:5000/api` instead of relying on a Next.js `/api` rewrite. This prevents the generic Next.js **Internal Server Error** when the backend is not reachable.

### 1. Start MongoDB
Make sure the MongoDB Windows service is running. The application uses:

`mongodb://127.0.0.1:27017/task-management`

### 2. Install dependencies
From the project root:

```powershell
npm install
cd client
npm install
cd ..
cd server
npm install
cd ..
```

### 3. Start both applications

```powershell
npm run dev
```

Frontend: http://localhost:3000  
API: http://localhost:5000/api  
Health check: http://localhost:5000/api/health

### 4. Seed demo data
In a second terminal:

```powershell
npm run seed
```

### Demo login
- Email: `admin@example.com`
- Password: `Admin@12345`

Other demo users:
- `manager@example.com` / `Manager@12345`
- `member@example.com` / `Member@12345`

## Important
If the browser still shows an old error after replacing the project, stop Next.js (`Ctrl+C`), delete the `client/.next` folder, then run `npm run dev` again.
