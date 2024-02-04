import { Category } from "./Category";
import { ImageGridTab } from "./ImageGridTab";
import { ThingType } from "./ThingType";

export enum ImageSortKey {
  None,
  FileName,
  Category,
  Random,
  Image,
}

export enum ThingSortKey_new {
  None = "None",
  FileName = "File Name",
  Category = "Category",
  Random = "Random",
  Name = "Name",
}

export type ImageSortKeyType = {
  imageSortKeyName: string;
  imageSortKey: ImageSortKey;
  comparerFunction: (
    a: { name: string; category: Category },
    b: { name: string; category: Category }
  ) => number;
  objectType: ImageGridTab | "All";
};

export type ThingSortType_new = {
  sortKeyName: string;
  sortKey: ThingSortKey_new;
  comparerFunction: (a: ThingType, b: ThingType) => number;
};

export const defaultImageSortKey: ImageSortKeyType = {
  imageSortKeyName: "None",
  imageSortKey: ImageSortKey.None,
  comparerFunction: (a, b) => 0,
  objectType: "All",
};

export const availableImageSortKeys: ImageSortKeyType[] = [
  {
    imageSortKeyName: "File name",
    imageSortKey: ImageSortKey.FileName,
    comparerFunction: (a, b) => a.name.localeCompare(b.name),
    objectType: "Images",
  },
  {
    imageSortKeyName: "Category",
    imageSortKey: ImageSortKey.Category,
    comparerFunction: (a, b) => a.category.name.localeCompare(b.category.name),
    objectType: "All",
  },
  {
    imageSortKeyName: "Random",
    imageSortKey: ImageSortKey.Random,
    comparerFunction: (a, b) => (Math.round(Math.random() * 10) >= 5 ? 1 : -1),
    objectType: "All",
  },
  {
    imageSortKeyName: "Image",
    imageSortKey: ImageSortKey.Image,
    comparerFunction: (a, b) => a.name.localeCompare(b.name),
    objectType: "Annotations",
  },
];

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
