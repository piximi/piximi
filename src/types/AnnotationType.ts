export type AnnotationType = {
  // x1, y1, W, H
  boundingBox: [number, number, number, number];
  categoryId: string;
  id: string;
  mask: Array<number>;
  plane: number;
};
