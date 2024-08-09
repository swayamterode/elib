import { config as conf } from "dotenv";
conf();

const _config = {
  port: process.env.PORT || 3000,
  //   add other configurations here
};

export const config = Object.freeze(_config); // freeze the object to prevent modification on runtime
