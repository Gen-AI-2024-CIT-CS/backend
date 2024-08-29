import express from 'express';
import bcrypt from 'bcrypt';
import pool from '../config/db';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (user && await bcrypt.compare(password, user.password)) {
      // In a real app, you would create and send a JWT token here
      res.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});


export default router;