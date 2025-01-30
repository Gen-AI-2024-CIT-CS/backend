import express from 'express';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

router.post('/', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Missing 'message' in request body" });
  }

  try {
    const flaskResponse = await axios.post('http://localhost:5000/process_query', { query: message });

    if (!flaskResponse.data) {
      return res.status(400).json({ error: "Invalid response from Flask API" });
    }

    console.log(flaskResponse.data);

    res.status(200).json(flaskResponse.data);
  } catch (error: any) {
    console.error('Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
