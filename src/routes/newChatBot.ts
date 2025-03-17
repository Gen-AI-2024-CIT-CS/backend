import express from 'express';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const prisma = new PrismaClient();

const SQL_GENERATION_API = process.env.SQL_GENERATION_API;

router.post('/generate', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Missing 'message' in request body" });
  }

  try {
    console.log(`Received message: ${message}`);
    
    // Step 1: Generate SQL from natural language using the external API
    const sqlGenerationResponse = await axios.post(
      `${SQL_GENERATION_API}/generate-sql`,
      { query: message },
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    const sqlQuery = sqlGenerationResponse.data.sql_query;
    console.log(`Generated SQL query: ${sqlQuery}`);

    // Step 2: Execute the SQL query using Prisma
    const result = await prisma.$queryRawUnsafe(sqlQuery);

    // Step 3: Return response
    res.status(200).json({ query: message, sql: sqlQuery, data: result });
  } catch (error: any) {
    console.error('Error processing request:', error.response?.data || error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/health', async (req, res) => {
    try{
        const healthResponse = await axios.get(`${SQL_GENERATION_API}/health`);
        res.status(200).json(healthResponse.data);
        console.log(healthResponse.data);
    }
    catch(error: any){
        console.error('Error processing request:', error.response?.data || error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
