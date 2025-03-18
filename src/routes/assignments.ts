import express from 'express';
import pool from '../config/db';  

const assignmentsRouter = express.Router();

assignmentsRouter.get('/', async (req, res) => {
    try {   
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        const currentSemester = currentMonth >= 1 && currentMonth <= 6 ? 'even' : 'odd';
        const client = await pool.connect();        
        const result = await client.query(`
            SELECT assignments.*, courses_enrolled.course_id, student.dept, student.year
            FROM assignments 
            JOIN courses_enrolled ON assignments.email = courses_enrolled.email and assignments.courseid = courses_enrolled.course_id 
            JOIN student ON assignments.email = student.email and courses_enrolled.year = $1 and courses_enrolled.semester = $2
        `, [currentYear, currentSemester]);
        res.json(result.rows);
        client.release();
    } catch (error) {
        console.error('Error executing SQL query:', error);
        res.status(500).json({ error: 'Internal Server Error' });   
    }
});

export default assignmentsRouter;