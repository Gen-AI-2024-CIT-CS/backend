import express from 'express';
import pool from '../config/db';  

const assignmentsRouter = express.Router();

assignmentsRouter.get('/', async (req, res) => {
    try {   
        const client = await pool.connect();        
        const result = await client.query(`
            SELECT assignments.*, courses_enrolled.course_id, student.dept 
            FROM assignments 
            JOIN courses_enrolled ON assignments.email = courses_enrolled.email
            JOIN student ON assignments.email = student.email
        `); 
        res.json(result.rows);
        client.release();
    } catch (error) {
        console.error('Error executing SQL query:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default assignmentsRouter;