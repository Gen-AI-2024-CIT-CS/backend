import express from 'express';
import pool from '../config/db';  
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();
const prisma = new PrismaClient();
const mentormenteeRouter = express.Router();

mentormenteeRouter.get('/', async (req, res) => {
    try {
        // Retrieve JWT token from cookies
        const token = req.cookies["jwt_token"];
        console.log("Token received:", token);

        if (!token) {
            return res.status(400).json({ message: "Token not provided." });
        }

        // Decode and verify token
        const decoded = jwt.verify(token as string, process.env.JWT_SECRET as string) as { email: string, role: string };
        let role = decoded.role;
        let userName = '';

        if (role === 'admin') {
            console.log("User is an admin");
        } else if (role === 'user') {
            console.log("Fetching user details from Prisma...");
            const user = await prisma.user.findUnique({
                where: { email: decoded.email },
                select: { name: true },
            });

            if (!user) {
                return res.status(404).json({ message: "User not found." });
            }

            userName = user.name;
            console.log("User found:", userName);
        } else {
            return res.status(401).json({ message: "Invalid role in token." });
        }

        // Fetch mentee data from PostgreSQL
        console.log("Connecting to PostgreSQL...");
        const client = await pool.connect();

        let queryResult;
        if (role === 'admin') {
            console.log("Fetching all mentees for admin...");
            queryResult = await client.query('SELECT * FROM mentee');
        } else if (role === 'user') {
            console.log(`Fetching mentees for mentor: ${userName}`);
            queryResult = await client.query('SELECT * FROM mentee WHERE mentor_name = $1', [userName]);
        }

        client.release();
        
        if (!queryResult || queryResult.rows.length === 0) {
            console.log("No mentees found.");
            return res.status(404).json({ message: "No mentees found." });
        }

        console.log("Mentees fetched successfully");
        return res.json(queryResult.rows);

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default mentormenteeRouter;
