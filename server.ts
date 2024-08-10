import app from "./src/app";
import { config } from "./src/config/config";
import connectDB from "./src/config/db";

const startServer = async () => {
  await connectDB();
  app.listen(config.port, () => {
    console.log(`Server is running on port ${config.port}`);
  });
};

startServer();
