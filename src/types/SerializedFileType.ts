import { SerializedAnnotationType } from "./SerializedAnnotationType";

type SerializedCategoryType = {
  id: string;
  color: string; // 3 byte hex
  name: string;
  visible: boolean;
};

export type SerializedFileType = {
  categories: Array<SerializedCategoryType>;
  annotations: Array<SerializedAnnotationType>;
};
