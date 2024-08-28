import express from 'express';
import cors from 'cors';
import userRoutes from './routes/users';
import authRoutes from './routes/auth';

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000'
}));

app.use(express.json());
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});