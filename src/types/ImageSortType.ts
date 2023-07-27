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

export const sortKeyByName = (name: string): ImageSortKeyType => {
  const sortKeyIdx = availableImageSortKeys
    .map((e) => e.imageSortKeyName)
    .indexOf(name);

  if (sortKeyIdx >= 0) {
    return availableImageSortKeys[sortKeyIdx];
  } else {
    return defaultImageSortKey;
  }
};
export const sortTypeByKey = (key: ImageSortKey): ImageSortKeyType => {
  const sortKeyIdx = availableImageSortKeys
    .map((e) => e.imageSortKey)
    .indexOf(key);

  if (sortKeyIdx >= 0) {
    return availableImageSortKeys[sortKeyIdx];
  } else {
    return defaultImageSortKey;
  }
};
