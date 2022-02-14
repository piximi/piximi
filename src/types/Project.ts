import { Category } from "./Category";
import { ImageType } from "./ImageType";
import { ImageSortKeyType } from "./ImageSortType";
import { Task } from "./Task";

export type Project = {
  categories: Array<Category>;
  name: string;
  images: Array<ImageType>;
  task: Task;
  trainFlag: number; //whether we apply a pre-trained network or want to train one
  imageSortKey: ImageSortKeyType;
};
