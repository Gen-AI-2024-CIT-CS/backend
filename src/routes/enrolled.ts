import express from 'express';
import pool from '../config/db';

const enrolledRouter = express.Router();

enrolledRouter.get('/', async (req, res) => {
    try {   
        const client = await pool.connect();
        var query = `SELECT s.email, ce.course_id, ce.status, s.dept , s.year
            FROM courses_enrolled ce 
            JOIN student s ON s.email = ce.email`;     
        if(req.query.dept){
            query += ' WHERE s.dept = $1';
            const result = await client.query(query, [req.query.dept]);
            res.json(result.rows);
        }else{
            const result = await client.query(query);
            res.json(result.rows);
        }
        client.release();
    } catch (error) {
        console.error('Error executing SQL query:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default enrolledRouter;
