import { BoundingBox } from "./BoundingBox";

export type Instance = {
  boundingBox: BoundingBox;
  categoryId?: string;
  mask: any; //modify later
};
