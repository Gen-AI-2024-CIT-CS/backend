import express, { Request, Response } from 'express';
import pool from '../config/db';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();
const prisma = new PrismaClient();

const menteeAssignment = express.Router();

// Define JWT payload type
interface JwtPayload {
    email: string;
    role: string;
}

menteeAssignment.get('/', async (req: Request, res: Response) => {
    try {
        // Retrieve JWT token from cookies
        const token = req.cookies["jwt_token"];
        console.log("Token received:", token);

        if (!token) {
            return res.status(400).json({ message: "Token not provided." });
        }

        // Decode and verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
        const { email: userEmail, role } = decoded;
        let userName = '';

        const client = await pool.connect();
        let queryResult;

        if (role === 'admin') {
            console.log("Fetching all assignments for admin...");
            queryResult = await client.query(`
                SELECT assignments.*, courses_enrolled.course_id, student.dept 
                FROM assignments 
                JOIN courses_enrolled ON assignments.email = courses_enrolled.email
                JOIN student ON assignments.email = student.email

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
            console.log("Fetching assignments for mentor's mentees...");

            // Get mentees assigned to this mentor
            const menteesQuery = await client.query(`SELECT email FROM mentee WHERE mentor_name = $1`, [userName]);

            if (menteesQuery.rows.length === 0) {
                client.release();
                return res.status(404).json({ message: "No mentees found for this mentor." });
            }

            const menteeEmails: string[] = menteesQuery.rows.map(m => m.email);

            // Fetch assignments for mentees of this mentor
            queryResult = await client.query(`
                SELECT assignments.*, courses_enrolled.course_id, student.dept 
                FROM assignments 
                JOIN courses_enrolled ON assignments.email = courses_enrolled.email
                JOIN student ON assignments.email = student.email
                WHERE assignments.email = ANY($1)
            `, [menteeEmails]);
        }

        client.release();

        if (!queryResult || queryResult.rows.length === 0) {
            console.log("No assignments found.");
            return res.status(404).json({ message: "No assignments found." });
        }

        console.log("Assignments fetched successfully");
        return res.json(queryResult.rows);

    } catch (error: unknown) {
        console.error('Error executing SQL query:', error);

        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ error: "Invalid token." });
        }

        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default menteeAssignment;
