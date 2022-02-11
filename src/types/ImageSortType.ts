import { ImageType } from "./ImageType";

enum ImageSortKey {
  None,
  FileName,
  Category,
}

export type ImageSortKeyType = {
  imageSortKeyName: string;
  imageSortKey: ImageSortKey;
  comparerFunction: (a: Image, b: Image) => number;
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
];
