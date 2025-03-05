import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { exec } from "child_process";

const studentUploadRouter = express.Router();

// Ensure the "uploads" directory exists
const uploadDir = path.join(__dirname, "../scripts");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer storage
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    cb(null, "students.csv"); // Save as mentee.csv
  },
});

const upload = multer({ storage });

// API endpoint for file upload
studentUploadRouter.post("/", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded." });
  }

  // Get the absolute path of the Python script
const scriptPath = path.join(__dirname, "../scripts/insertStudents.py"); // Adjust the path if neededt
  const command = process.platform === "win32" ? `py "${scriptPath}"` : `python3 "${scriptPath}"`;

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
        fs.unlink(path.join(uploadDir, "students.csv"), (err) => {
            if (err) {
                console.error("Error deleting file:", err.message);
            } else {
                console.log("File deleted successfully.");
            }
        });
        console.log("Script stdout:", stdout);
        res.status(200).json({ message: "File uploaded and processed successfully!" });
    }
  });
});

export default studentUploadRouter;
