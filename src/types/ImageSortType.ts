import { ImageType } from "./ImageType";

export enum ImageSortKey {
  None,
  FileName,
  Category,
  Random,
}

export type ImageSortKeyType = {
  imageSortKeyName: string;
  imageSortKey: ImageSortKey;
  comparerFunction: (a: ImageType, b: ImageType) => number;
};

export const defaultImageSortKey: ImageSortKeyType = {
  imageSortKeyName: "None",
  imageSortKey: ImageSortKey.None,
  comparerFunction: (a, b) => 0,
};

export const availableImageSortKeys: ImageSortKeyType[] = [
  {
    imageSortKeyName: "File name",
    imageSortKey: ImageSortKey.FileName,
    comparerFunction: (a, b) => a.name.localeCompare(b.name),
  },
  {
    imageSortKeyName: "Image category",
    imageSortKey: ImageSortKey.Category,
    comparerFunction: (a, b) => a.categoryId.localeCompare(b.categoryId),
  },
  {
    imageSortKeyName: "Random",
    imageSortKey: ImageSortKey.Random,
    comparerFunction: (a, b) => (Math.round(Math.random() * 10) >= 5 ? 1 : -1),
  },
];
