import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { exec } from "child_process";

const studentUploadRouter = express.Router();
    // Function to send response and perform cleanup
interface ResponseBody {
  message: string;
  invalidRecords?: any[];
}
// Ensure the "uploads" directory exists
const uploadDir = path.join(__dirname, "../scripts");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer storage
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    cb(null, "students.csv"); // Save as students.csv
  },
});

const upload = multer({ storage });

// Helper function for file cleanup
const cleanupFile = () => {
  const filePath = path.join(uploadDir, "students.csv");
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error("Error deleting file:", err.message);
    } else {
      console.log("File deleted successfully.");
    }
  });
};

// API endpoint for file upload
studentUploadRouter.post("/", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded." });
  }

  // Get the absolute path of the Python script
  const scriptPath = path.join(__dirname, "../scripts/insertStudents.py");
  const command = process.platform === "win32" ? `py "${scriptPath}"` : `python3 "${scriptPath}"`;

  exec(command, (err, stdout, stderr) => {
    let responseHandled = false;

    const sendResponseAndCleanup = (status: number, body: ResponseBody) => {
      if (!responseHandled) {
      res.status(status).json(body);
      responseHandled = true;
      cleanupFile(); // Always clean up the file after sending response
      }
    };

    if (err) {
      console.error("Error executing script:", err.message);
      return sendResponseAndCleanup(500, { message: "Error executing script." });
    }
    
    if (stderr) {
      console.error("Script stderr:", stderr);
      return sendResponseAndCleanup(500, { message: "Script error." });
    }
    
    if (stdout.includes("Invalid Data")) {
      try {
        // Extract the invalid records from stdout
        const invalidRecords = [];
        const lines = stdout.split('\n');
        let capturingRecords = false;

        for (const line of lines) {
          if (line.includes("Invalid Data:")) {
            capturingRecords = true;
            continue;
          }
          
          if (line.includes("Total invalid records:")) {
            capturingRecords = false;
            continue;
          }
          
          if (capturingRecords && line.trim().length > 0) {
            // Extract the JSON-like string directly using a more flexible regex
            const match = line.match(/\d+\.\s*(\{.+\})/);            
            if (match && match[1]) {
              try {
                // Replace single quotes with double quotes for JSON format
                let jsonStr = match[1]
                  .replace(/'/g, '"')
                  .replace(/\\ufeff/g, '')
                  .replace(/:\s*None\s*([,}])/g, ':null$1');
                
                const record = JSON.parse(jsonStr);
                invalidRecords.push(record);
              } catch (parseError) {
                console.error("Failed to parse record:", match[1], parseError);
                invalidRecords.push({ raw: match[1], parseError: (parseError as Error).message });
              }
            } else {
              console.log("No match found for line:", line);
            }
          }
        }
        
        sendResponseAndCleanup(400, { 
          message: "Invalid data found", 
          invalidRecords 
        });
      } catch (e) {
        console.error("Error processing invalid data:", e);
        sendResponseAndCleanup(400, { message: "Error processing invalid data" });
      }
    } else if (stdout.startsWith("Error")) {
      console.error("Script error:", stdout);
      sendResponseAndCleanup(500, { message: "Script error." });
    } else {
      console.log("Script stdout:", stdout);
      sendResponseAndCleanup(200, { message: "File uploaded and processed successfully!" });
    }
  });
});

export default studentUploadRouter;
