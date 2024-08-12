import express from "express";
import { createBook } from "./bookController";
const bookRouter = express.Router();
import { uploadFiles } from "../middlewares/multer";
// Routes
bookRouter.post("/", uploadFiles, createBook);

export default bookRouter;
