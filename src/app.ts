import express from "express";
import globalErrorHandler from "./middlewares/globalErrorHandler";

const app = express();

app.get("/", (req, res) => {
  res.json({ message: "Welcome to the elib API project 👋🏻" });
});

// Global error handler middleware
app.use(globalErrorHandler);

export default app;
