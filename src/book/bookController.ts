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

// const updateBook = async (
//   req: AuthRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   const bookId = req.params.bookId;
//   const { title, genre } = req.body;
//   try {
//     const book = await bookModel.findOne({ _id: bookId }); // find the book by id return null if not found or the book object
//     if (!book) {
//       next(createHttpError(404, "Book not found"));
//     }
//     if (book && book.author.toString() !== req.userId) {
//       return next(
//         createHttpError(
//           403,
//           "You are not allowed to update this book (Unauthorized)!"
//         )
//       );
//     }
//     const files = req.files as { [fieldname: string]: Express.Multer.File[] };
//     if (!files.coverImage) {
//       next(createHttpError(400, "Cover Image is required"));
//     }
//     if (!files.file) {
//       next(createHttpError(400, "Book pdf is required"));
//     }
//     // for updating the cover image
//     let completeCoverImage = "";
//     if (files.coverImage) {
//       const fileName = files.coverImage[0].filename;
//       const coverMineType = files.coverImage[0].mimetype.split("/").at(-1);
//       const filePath = path.resolve(
//         __dirname,
//         "../../public/data/uploads" + fileName
//       );
//       completeCoverImage = `${fileName}.Date.now()`;
//       const uploadNewCoverImage = await cloudinary.uploader.upload(filePath, {
//         folder: "book-covers",
//         format: coverMineType,
//         filename_override: completeCoverImage,
//       });
//       completeCoverImage = uploadNewCoverImage.secure_url; // get the secure url of the uploaded image
//       try {
//         await fs.promises.unlink(completeCoverImage);
//       } catch (error) {
//         next(
//           createHttpError(
//             500,
//             "Error in deleting Cover Image from public folder"
//           )
//         );
//       }
//     }
//     // for updating the book pdf
//     let completeBook = "";
//     if (files.file) {
//       const BookFileName = files.file[0].filename;
//       const bookMineType = files.file[0].mimetype.split("/").at(-1);
//       const filePath = path.resolve(
//         __dirname,
//         "../../public/data/uploads" + BookFileName
//       );
//       completeBook = BookFileName;
//       const uploadNewBook = await cloudinary.uploader.upload(filePath, {
//         folder: "books-pdf",
//         resource_type: "raw",
//         format: bookMineType,
//         filename_override: completeBook,
//       });
//       completeBook = uploadNewBook.secure_url;
//       try {
//         await fs.promises.unlink(completeBook);
//       } catch (error) {
//         next(createHttpError(500, "Error in deleting Book from public folder"));
//       }
//     }
//     // update the book
//     const updatedBook = await bookModel.findOneAndUpdate(
//       { _id: bookId },
//       {
//         title: title,
//         genre: genre,
//         coverImage: completeCoverImage
//           ? completeCoverImage
//           : book?.coverImage || "",
//         file: completeBook ? completeBook : book?.file || "",
//       },
//       { new: true }
//     );
//     res.status(200).json({
//       success: "true",
//       message: "Book updated successfully",
//       data: {
//         id: updatedBook?._id,
//         title: updatedBook?.title,
//         genre: updatedBook?.genre,
//         coverImage: updatedBook?.coverImage,
//         file: updatedBook?.file,
//       },
//     });
//   } catch (error) {
//     next(createHttpError(500, "Cannot update book check back later"));
//   }
// };
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

export { createBook, updateBook };
