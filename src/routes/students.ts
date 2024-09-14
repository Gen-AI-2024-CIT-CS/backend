import express from 'express';
import pool from '../config/db';

const studentsRouter = express.Router();

studentsRouter.get('/', async (req, res) => {
    try {   
        const client = await pool.connect();        
        const result = await client.query(
            `SELECT s.email, ce.course_id, ce.status, s.dept 
            FROM courses_enrolled ce 
            JOIN student s ON s.email = ce.email 
            WHERE s.dept = $1`, 
            [req.query.dept]  // Pass the department as a parameter
        );
        res.json(result.rows);
        client.release();
    } catch (error) {
        console.error('Error executing SQL query:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default studentsRouter;
