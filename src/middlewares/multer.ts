import multer from "multer";

// Multer configuration diskStorage
const storage = multer.diskStorage({
  destination: function (req, res, cb) {
    cb(null, "../../public/data/uploads");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

// multer configuration: tell multer to store files in the diskStorage configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 3e7, // 30MB
  },
});

// Multer middleware to upload files with specific fields
const uploadFiles = upload.fields([
  { name: "coverImage", maxCount: 1 },
  { name: "file", maxCount: 1 },
]);

export { uploadFiles };
