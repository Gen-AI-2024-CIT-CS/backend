import express from 'express';
import pool from '../config/db';  

const assignmentsRouter = express.Router();

assignmentsRouter.get('/', async (req, res) => {
    try {   
        const client = await pool.connect();        
        const result = await client.query('SELECT * FROM assignments JOIN student on assignments.email = student.email WHERE student.dept = $1', [req.query.dept]); 
        res.json(result.rows);
        client.release();
    } catch (error) {
        console.error('Error executing SQL query:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default assignmentsRouter;