import express from 'express';
import pool from '../config/db';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();
const prisma = new PrismaClient();
const mentorRouter = express.Router();

mentorRouter.get('/', async (req, res) => {
    try {
        const token = req.cookies["jwt_token"];
        console.log("Token received in mentor route:", token);

        if (!token) {
            return res.status(400).json({ message: "Token not provided." });
        }

        // Verify token
        const decoded = jwt.verify(token as string, process.env.JWT_SECRET as string) as { email: string, role: string };
        const { email: userEmail, role } = decoded;
        let userName = '';
        
        // Connect to database
        console.log("Connecting to PostgreSQL...");
        const client = await pool.connect();
        let queryResult;

        if (role === 'admin') {
            queryResult = await client.query(`
                SELECT DISTINCT m.mentor_name as name
                FROM mentee m
                WHERE m.mentor_name IS NOT NULL
                ORDER BY m.mentor_name
            `);
        } else if (role === 'user') {
            const user = await prisma.user.findUnique({
                where: { email: userEmail },
                select: { name: true },
            });

            if (!user) {
                return res.status(404).json({ message: "User not found." });
            }

            userName = user.name;
            queryResult = await client.query(`
                SELECT DISTINCT m.mentor_name as name
                FROM mentee m
                WHERE m.mentor_name = $1
                ORDER BY m.mentor_name
            `, [userName]);
        } else {
            return res.status(401).json({ message: "Invalid role in token." });
        }

        client.release();

        if (!queryResult || queryResult.rows.length === 0) {
            console.log("No mentors found.");
            return res.status(404).json({ message: "No mentors found." });
        }

        // Filter out any null mentor names (just in case)
        const mentors = queryResult.rows.filter(mentor => mentor.name);
        
        console.log("Mentors fetched successfully:", mentors);
        return res.json(mentors);

    } catch (error) {
        console.error('Error in mentor endpoint:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default mentorRouter;