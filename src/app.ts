import express from 'express';
import cors from 'cors';
import userRoutes from './routes/users';
import authRoutes from './routes/auth';
import chatRoutes from './routes/chat'; // Import the chat route handler
import cookieParser from 'cookie-parser';

const app = express();

app.use(cookieParser());
app.use(cors({
  credentials: true,
  origin: process.env.FRONTEND_URL || 'http://localhost:3000'
}));

app.use(express.json());

// Add user and auth routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);

// Add chatbot route
app.use('/api/chat', chatRoutes);  // Adding the chat route

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
