import express from 'express';
import axios from 'axios';  // To send requests to Flask API

const router = express.Router();

// Handle POST requests from the frontend to /api/chat
router.post('/', async (req, res) => {
  const userMessage = req.body.message;

  try {
    // Send the user message to Flask API
    const flaskResponse = await axios.post('http://localhost:5000/process_query', { message: userMessage });

    // Return the Flask API's response back to the frontend
    res.status(200).json(flaskResponse.data);
  } catch (error) {
    console.error('Error communicating with Flask API:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
