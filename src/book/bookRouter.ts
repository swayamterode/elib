import express from "express";
import { createBook } from "./bookController";
const bookRouter = express.Router();
import { uploadFiles } from "../middlewares/multer";
import authenticate from "../middlewares/authenticate";
// Routes
bookRouter.post("/", authenticate, uploadFiles, createBook);

export default bookRouter;
