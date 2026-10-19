import 'dotenv/config'; import express from 'express'; import cors from 'cors'; import mongoose from 'mongoose'; import authRoutes from './routes/auth.js'; import apiRoutes from './routes/crud.js';
const requiredEnv=['JWT_ACCESS_SECRET','JWT_REFRESH_SECRET','MONGODB_URI'] as const;
const missingEnv=requiredEnv.filter((key)=>!process.env[key]?.trim());
if(missingEnv.length){ console.error(`Missing environment variables: ${missingEnv.join(', ')}. Copy server\.env.example to server\.env and set them.`); process.exit(1); }

const app=express();
const allowedOrigins = new Set([process.env.CLIENT_URL || 'http://localhost:3000', 'http://localhost:3000', 'http://127.0.0.1:3000']);
app.use(cors({origin:(origin, callback)=>{ if(!origin || allowedOrigins.has(origin)) return callback(null,true); callback(new Error('CORS origin not allowed')); }}));
app.use(express.json());
app.get('/api/health',(_,res)=>res.json({status:'ok',service:'task-management-api'})); app.use('/api/auth',authRoutes); app.use('/api',apiRoutes);
const port=Number(process.env.PORT||5000);
mongoose.connect(process.env.MONGODB_URI||'mongodb://127.0.0.1:27017/task-management').then(()=>{ app.listen(port,'0.0.0.0',()=>console.log(`API running on http://localhost:${port}`)); }).catch(e=>{ console.error('MongoDB connection failed. Make sure the MongoDB service is running.'); console.error(e instanceof Error ? e.message : e); process.exit(1); });
