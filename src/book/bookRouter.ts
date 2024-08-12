import express from "express";
import { createBook, updateBook } from "./bookController";
const bookRouter = express.Router();
import { uploadFiles } from "../middlewares/multer";
import authenticate from "../middlewares/authenticate";
// Routes
bookRouter.post("/", authenticate, uploadFiles, createBook);
bookRouter.patch("/:bookId", authenticate, uploadFiles, updateBook);
export default bookRouter;
