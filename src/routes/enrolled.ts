import express from 'express';
import pool from '../config/db';

const enrolledRouter = express.Router();

enrolledRouter.get('/', async (req, res) => {
    try {   
        const client = await pool.connect();
        const year = new Date().getFullYear();
        const month = new Date().getMonth() + 1;
        const semester = month >= 1 && month <= 6 ? 'even' : 'odd';
        var query = `SELECT s.email, ce.course_id, ce.status, s.dept,s.year
            FROM courses_enrolled ce 
            JOIN student s ON s.email = ce.email WHERE ce.year = $1 AND ce.semester = $2`;     
        if(req.query.dept){
            query += ' AND s.dept = $3';
            const result = await client.query(query, [year, semester, req.query.dept]);
            res.json(result.rows);
        }else{
            const result = await client.query(query, [year, semester]);
            res.json(result.rows);
        }
        client.release();
    } catch (error) {
        console.error('Error executing SQL query:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default enrolledRouter;
