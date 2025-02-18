import express from 'express';
import pool from '../config/db';

const studentRouter = express.Router();

studentRouter.get('/', async (req, res) => {
    try {   
        const client = await pool.connect();
        const query = `SELECT * from student JOIN courses_enrolled ON student.email = courses_enrolled.email`; 
        const result = await client.query(query);
        res.json(result.rows);
        client.release();
    } catch (error) {
        console.error('Error executing SQL query:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default studentRouter;
