import express from 'express';
import cors from 'cors';
import userRoutes from './routes/users';
import authRoutes from './routes/auth';
import chatRoutes from './routes/chat'; // Import the chat route handler
import assignmentsRouter from './routes/assignments';
import enrolledRouter from './routes/enrolled';
import studentRouter from './routes/student';
import assignmentUploadRouter from './routes/uploadAssignments';
import studentUploadRouter from './routes/uploadStudents';
import coursesEnrolledRouter from './routes/uploadCoursesEnrolled';
import mentormenteeRouter from './routes/mentorMentee';
import menteeAssignment from './routes/menteeAssignment';
import coursesRouter from './routes/fetchCourses';
import cookieParser from 'cookie-parser';
import mentorRouter from './routes/mentorRouter';
import coursesDisplayRouter from './routes/coursesEnrolled';

const app = express();

app.use(cookieParser());

app.use(express.json());

app.use(cors({
  credentials: true,
  origin: process.env.FRONTEND_URL || 'http://localhost:3002'
}));

// Add user and auth routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes); 
app.use('/api/assignments',assignmentsRouter)
app.use('/api/enrolled',enrolledRouter)
app.use('/api/uploadAssignments', assignmentUploadRouter);
app.use('/api/uploadStudents', studentUploadRouter);
app.use('/api/uploadCoursesEnrolled', coursesEnrolledRouter);
app.use('/api/mentormentee', mentormenteeRouter)
app.use('/api/menteeAssignment', menteeAssignment)
app.use('/api/courses',coursesRouter);
app.use('/api/mentors', mentorRouter);
app.use('/api/students', studentRouter);
app.use('/api/coursesDisplayRouter', coursesDisplayRouter)
// Add chatbot route
app.use('/api/chat', chatRoutes);  // Adding the chat route

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});



