import express from 'express';
import cors from 'cors';
import userRoutes from './routes/users';
import authRoutes from './routes/auth';
import assignmentsRouter from './routes/assignments';
import studentsRouter from './routes/students';
import cookieParser from 'cookie-parser';

const app = express();

app.use(cookieParser());
app.use(cors({
  credentials: true,
  origin: process.env.FRONTEND_URL || 'http://localhost:3000'
}));

app.use(express.json());
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes); 
app.use('/api/assignments',assignmentsRouter)
app.use('/api/students',studentsRouter)

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});