import { User } from "../user/userInterface";

export interface Book {
  _id: string;
  title: string;
  author: User;
  genre: string;
  coverImage: string;
  file: string;
  createdAt: Date;
  updatedAt: Date;
}
