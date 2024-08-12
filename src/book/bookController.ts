import { Request, Response, NextFunction } from "express";
import cloudinary from "../config/cloudinary";
import path from "node:path";
import createHttpError from "http-errors";

const UPLOADS_DIR = path.resolve(__dirname, `../../public/data/uploads`);

const createBook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (!files.coverImage || !files.file) {
      return res.status(400).json({ message: "Missing required files" });
    }

    const { coverImage, file } = files;

    const coverImageFile = coverImage[0];
    const bookFile = file[0];

    const coverImageMimeType = coverImageFile.mimetype.split("/").pop();
    const coverImageFileName = coverImageFile.filename;
    const coverImagePath = path.join(UPLOADS_DIR, coverImageFileName);

    const bookMimeType = bookFile.mimetype.split("/").pop();
    const bookFileName = bookFile.filename;
    const bookFilePath = path.join(UPLOADS_DIR, bookFileName);

    const [coverImageResult, bookResult] = await Promise.all([
      cloudinary.uploader.upload(coverImagePath, {
        folder: "book-covers",
        public_id: coverImageFileName,
        format: coverImageMimeType,
        resource_type: "image",
      }),
      cloudinary.uploader.upload(bookFilePath, {
        folder: "books-pdf",
        resource_type: "raw",
        filename_override: bookFileName,
        format: bookMimeType,
      }),
    ]);

    return res.json({
      message: "Files uploaded successfully",
      coverImage: coverImageResult.url,
      book: bookResult.url,
    });
  } catch (error) {
    next(createHttpError(500, "Cannot upload files check back later"));
  }
};

export { createBook };
