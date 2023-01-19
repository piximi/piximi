export type SerializedAnnotationType = {
  categoryId: string; // category id, matching id of a SerializedCategory
  id: string;
  mask: string; // e.g. "114 1 66 1 66 2 ..."
  plane: number;
  boundingBox: [number, number, number, number]; // [x1, y1, width, height]
};
