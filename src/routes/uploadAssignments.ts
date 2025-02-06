import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();
const prisma = new PrismaClient();

const assignmentUploadRouter = express.Router();

// Ensure the "uploads" directory exists
const uploadDir = path.join(__dirname, "../scripts");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer storage
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    cb(null, "mentee.csv"); // Save as mentee.csv
  },
});

const upload = multer({ storage });

// API endpoint for file upload
assignmentUploadRouter.post("/", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded." });
  }
  const token = req.cookies["jwt_token"];
  console.log("token", token);
  if(!token){
    return res.status(400).json({ message: "Token not provided." });
  }
  try {
    // Decode JWT token
    const decoded = jwt.verify(token as string, process.env.JWT_SECRET as string) as unknown as { email: string };
    if (!decoded.email) {
      return res.status(401).json({ message: "Invalid token." });
    }

    // Fetch user from the database using Prisma
    const user = await prisma.user.findUnique({
      where: { email: decoded.email },
      select: { name: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

  const userName = user.name;

  // Get the absolute path of the Python script
  const scriptPath = path.join(__dirname, "../scripts/insertAssignments.py"); // Adjust the path if neededt
  const command = process.platform === "win32" 
  ? `py "${scriptPath}" "${userName}"` 
  : `python3 "${scriptPath}" "${userName}"`;

  exec(command, (err, stdout, stderr) => {
    if (err) {
      console.error("Error executing script:", err.message);
      return res.status(500).json({ message: "Error executing script." });
    }
    if (stderr) {
      console.error("Script stderr:", stderr);
      return res.status(500).json({ message: "Script error." });
    }
    if (stdout.startsWith("Error")) {
      console.error("Script error:", stdout);
      return res.status(500).json({ message: "Script error." });
    }else{
        fs.unlink(path.join(uploadDir, "mentee.csv"), (err) => {
            if (err) {
                console.error("Error deleting file:", err.message);
            } else {
                console.log("File deleted successfully.");
            }
        });
        res.status(200).json({ message: "File uploaded and processed successfully!" });
    }
  });
  } catch (err) {
    console.error("JWT Verification Error:", err);
    return res.status(500).json({ message: "Invalid Token" });
  }
});

export default assignmentUploadRouter;
