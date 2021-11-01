export type AnnotationType = {
  boundingBox: [number, number, number, number];
  categoryId: string;
  id: string;
  mask: Array<number>;
};
