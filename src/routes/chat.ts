import express from 'express';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';  // Import Prisma

const router = express.Router();
const prisma = new PrismaClient();  // Initialize Prisma Client

// Handle POST requests from the frontend to /api/chat
router.post('/', async (req, res) => {
  const userMessage = req.body.message;

  try {
    // Send the user message to Flask API to get the SQL query
    const flaskResponse = await axios.post('http://localhost:5000/process_query', { message: userMessage });
    const sqlQuery = flaskResponse.data.sql;  // Assuming Flask returns { sql: '...' }

    console.log('SQL Query from Flask:', sqlQuery);

    // Execute the SQL query using Prisma
    const result = await prisma.$queryRawUnsafe(sqlQuery);

    console.log('Database query result:', result);

    // Return the result back to the frontend
    res.status(200).json({ data: result });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
