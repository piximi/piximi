import { Category } from "./Category";
import { Image } from "./Image";
import { Task } from "./Task";

export type Project = {
  categories: Array<Category>;
  name: string;
  images: Array<Image>;
  task: Task;
  trainFlag: number; //whether we apply a pre-trained network or want to train one
};
