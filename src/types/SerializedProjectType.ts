import { SerializedImageType } from "./SerializedImageType";
import { Category } from "./Category";

export type SerializedProjectType = {
  serializedImages: Array<SerializedImageType>;
  categories: Array<Category>;
  name: string;
};
