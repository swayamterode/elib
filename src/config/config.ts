import { config as conf } from "dotenv";

conf();

const _config = {
  port: process.env.PORT || 3000,
  databaseURL: process.env.MONGO_CONNECTION_STRING,
  env: process.env.NODE_ENV,
  jwtSecret: process.env.JWT_SECRET,
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
};

export const config = Object.freeze(_config); // freeze the object to prevent modification on runtime
