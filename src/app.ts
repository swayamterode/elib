import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.json({ message: "Welcome to the elib API project 👋🏻" });
});

export default app;
