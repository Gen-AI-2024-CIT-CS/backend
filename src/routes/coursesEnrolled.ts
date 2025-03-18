import express from 'express';
import pool from '../config/db';

const coursesDisplayRouter = express.Router();

coursesDisplayRouter.get('/course-counts', async (req, res) => {
    try {   
        const client = await pool.connect();
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        const currentSemester = currentMonth >= 1 && currentMonth <= 6 ? 'even' : 'odd';
        let query = `
            SELECT course_id, course_name, COUNT(*) as enrollment_count
            FROM courses_enrolled ce
            JOIN student s ON s.email = ce.email AND ce.year = $1 AND ce.semester = $2
        `;
        
        const queryParams = [currentYear, currentSemester];
        const conditions = [];
        
        // Add filters for department
        if (req.query.dept) {
            queryParams.push(req.query.dept as string);
            conditions.push(`s.dept = $${queryParams.length}`);
        }
        
        // Add filters for course
        if (req.query.course_id) {
            queryParams.push(req.query.course_id as string);
            conditions.push(`ce.course_id = $${queryParams.length}`);
        }
        
        if(req.query.year){
            queryParams.push(req.query.year as string);
            conditions.push(`s.year = $${queryParams.length}`);
        }

        // Add WHERE clause if conditions exist
        if (conditions.length > 0) {
            query += ` WHERE ${conditions.join(' AND ')}`;
        }
        
        // Finish the query with GROUP BY and ORDER BY
        query += `
            GROUP BY course_id, course_name
            ORDER BY enrollment_count DESC
        `;
        
        const result = await client.query(query, queryParams);
        res.json(result.rows);
        client.release();
    } catch (error) {
        console.error('Error executing SQL query:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default coursesDisplayRouter;