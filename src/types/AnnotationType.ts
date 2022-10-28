export type encodedAnnotationType = {
  boundingBox: [number, number, number, number];
  categoryId: string;
  id: string;
  mask: Array<number>;
  plane: number;
};
export type decodedAnnotationType = {
  boundingBox: [number, number, number, number];
  categoryId: string;
  id: string;
  maskData: Uint8Array;
  plane: number;
};
