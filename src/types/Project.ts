import { Category } from "./Category";
import { Image } from "./Image";

export type Project = {
  categories: Array<Category>;
  name: string;
  images: Array<Image>;
  tileSize: number;
};
