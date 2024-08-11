import express from "express";
import globalErrorHandler from "./middlewares/globalErrorHandler";

const app = express();
app.use(express.json()); // middleware to parse the request body

app.get("/", (req, res) => {
  res.json({ message: "Welcome to the elib API project 👋🏻" });
});

//  Routes
import userRouter from "./user/userRouter";
import bookRouter from "./book/bookRouter";

app.use("/api/users", userRouter);
app.use("/api/books", bookRouter);

// Global error handler middleware
app.use(globalErrorHandler);

export default app;
