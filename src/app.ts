import express from "express";
import globalErrorHandler from "./middlewares/globalErrorHandler";

const app = express();
app.use(express.json()); // middleware to parse the request body

app.get("/", (req, res) => {
  res.json({ message: "Welcome to the elib API project 👋🏻" });
});

//  Routes
import userRouter from "./user/userRouter";
app.use("/api/users", userRouter);

// Global error handler middleware
app.use(globalErrorHandler);

export default app;
