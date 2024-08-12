import { Request, Response, NextFunction } from "express";
import cloudinary from "../config/cloudinary";
import path from "node:path";
import fs from "node:fs";
import createHttpError from "http-errors";
import bookModel from "./bookModel";
import { AuthRequest } from "../middlewares/authenticate";

const UPLOADS_DIR = path.resolve(__dirname, `../../public/data/uploads`);

const createBook = async (req: Request, res: Response, next: NextFunction) => {
  const { title, genre } = req.body; // get the title and genre from the request body
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

    const _req = req as AuthRequest; // cast the request object to AuthRequest

    // create a new book
    const newBook = await bookModel.create({
      title: title,
      author: _req.userId,
      genre: genre,
      coverImage: coverImageResult.secure_url,
      file: bookResult.secure_url,
    });
    // delete the files after uploading to cloudinary
    try {
      await fs.promises.unlink(coverImagePath);
      await fs.promises.unlink(bookFilePath);
    } catch (error) {
      next(createHttpError(500, "Error in deleting files from public folder"));
    }

    return res.status(201).json({
      message: "Book created successfully",
      data: {
        id: newBook._id,
        title: newBook.title,
        genre: newBook.genre,
        coverImage: newBook.coverImage,
        file: newBook.file,
      },
    });
  } catch (error) {
    next(createHttpError(500, "Cannot upload files check back later"));
  }
};

export { createBook };
