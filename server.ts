import app from "./src/app";
import { config } from "./src/config/config";

const startServer = async () => {
  app.listen(config.port, () => {
    console.log(`Server is running on port ${config.port}`);
  });
};

startServer();
