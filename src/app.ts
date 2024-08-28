import express from 'express';
import cors from 'cors';
import userRoutes from './routes/users';

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000'
}));

app.use(express.json());
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
