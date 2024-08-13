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

const updateBook = async (req: Request, res: Response, next: NextFunction) => {
  const { title, description, genre } = req.body;
  const bookId = req.params.bookId;

  const book = await bookModel.findOne({ _id: bookId });

  if (!book) {
    return next(createHttpError(404, "Book not found"));
  }
  // Check access
  const _req = req as AuthRequest;
  if (book.author.toString() !== _req.userId) {
    return next(createHttpError(403, "You can not update others book."));
  }

  // check if image field is exists.

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  let completeCoverImage = "";
  if (files.coverImage) {
    const filename = files.coverImage[0].filename;
    const coverMimeType = files.coverImage[0].mimetype.split("/").at(-1);
    // send files to cloudinary
    const filePath = path.resolve(
      __dirname,
      "../../public/data/uploads/" + filename
    );
    completeCoverImage = filename;
    const uploadResult = await cloudinary.uploader.upload(filePath, {
      filename_override: completeCoverImage,
      folder: "book-covers",
      format: coverMimeType,
    });

    completeCoverImage = uploadResult.secure_url;
    await fs.promises.unlink(filePath);
  }

  // check if file field is exists.
  let completeFileName = "";
  if (files.file) {
    const bookFilePath = path.resolve(
      __dirname,
      "../../public/data/uploads/" + files.file[0].filename
    );

    const bookFileName = files.file[0].filename;
    completeFileName = bookFileName;

    const uploadResultPdf = await cloudinary.uploader.upload(bookFilePath, {
      resource_type: "raw",
      filename_override: completeFileName,
      folder: "book-pdfs",
      format: "pdf",
    });

    completeFileName = uploadResultPdf.secure_url;
    await fs.promises.unlink(bookFilePath);
  }

  const updatedBook = await bookModel.findOneAndUpdate(
    {
      _id: bookId,
    },
    {
      title: title,
      description: description,
      genre: genre,
      coverImage: completeCoverImage ? completeCoverImage : book.coverImage,
      file: completeFileName ? completeFileName : book.file,
    },
    { new: true }
  );

  res.json(updatedBook);
};

const listOfBooks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const books = await bookModel
      .find({ ...req.query }) // get all books
      .limit(Number(limit)) // limit the number of books
      .skip((Number(page) - 1) * Number(limit)) // pagination
      .sort({ createdAt: -1 }); // sort by createdAt in descending order

    const totalBooks = await bookModel.countDocuments();
    res.json({
      TotalBooks: totalBooks,
      totalPages: Math.ceil(totalBooks / Number(limit)),
      currentPage: page,
      books,
    });
  } catch (err) {
    return next(createHttpError(500, "Error while getting a book"));
  }
};

const getSingleBook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const bookId = req.params.bookId;
  try {
    const book = await bookModel.findOne({ _id: bookId });
    if (!book) {
      return next(createHttpError(404, "Book not found"));
    }
    res.json(book);
  } catch (error) {
    console.error("Error while getting a book:", error); // Log the error
    return next(createHttpError(500, "Error while getting a book"));
  }
};

const deleteBook = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const bookId = req.params.bookId;
  try {
    const book = await bookModel.findOne({ _id: bookId });
    // check if book exists
    if (!book) {
      return next(createHttpError(404, "Book not found"));
    }
    // means user can only delete his/her book
    if (book.author.toString() !== req.userId) {
      return next(createHttpError(403, "You can not delete others book."));
    }
    // remove the files from cloudinary

    // Generate public id from the file path cloudinary
    const coverFilesSplit = book.coverImage.split("/");
    const coverImagePublicId =
      coverFilesSplit.at(2) + "/" + coverFilesSplit.at(-1)?.split(".").at(-2);

    const bookFilesSplit = book.file.split("/");
    const bookPublicId = bookFilesSplit.at(2) + "/" + bookFilesSplit.at(-1);

    try {
      await cloudinary.uploader.destroy(coverImagePublicId);
    } catch (error) {
      return next(
        createHttpError(500, "Error while deleting a Cover Image of Book")
      );
    }
    try {
      await cloudinary.uploader.destroy(bookPublicId, {
        resource_type: "raw",
      });
    } catch (error) {
      return next(createHttpError(500, "Error while deleting a book pdf"));
    }

    await bookModel.deleteOne({ _id: bookId });
    return res.status(204).json({
      message: "Book deleted successfully",
    });
  } catch (error) {
    return next(createHttpError(500, "Error while deleting a book"));
  }
};
export { createBook, updateBook, listOfBooks, getSingleBook, deleteBook };
