import express from 'express';
import pool from '../config/db';  

const coursesRouter = express.Router();

coursesRouter.get('/', async (req, res) => {
    try {   
        const client = await pool.connect();        
        const result = await client.query(`
            SELECT * FROM COURSE
        `); 
        res.json(result.rows);
        client.release();
    } catch (error) {
        console.error('Error executing SQL query:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default coursesRouter;