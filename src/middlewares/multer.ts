import multer from "multer";
import fs from "fs";
import path from "path";

// Define the upload directory
const uploadDir = path.resolve(__dirname, "../../public/data/uploads");

// Ensure the upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer configuration diskStorage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

// multer configuration: tell multer to store files in the diskStorage configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1e7, // 10MB
  },
});

// Multer middleware to upload files with specific fields
const uploadFiles = upload.fields([
  { name: "coverImage", maxCount: 1 },
  { name: "file", maxCount: 1 },
]);

export { uploadFiles };
