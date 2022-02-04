enum ImageSortKey {
  None,
  FileName,
  Category,
}

export type ImageSortKeyType = {
  imageSortKeyName: string;
  imageSortKey: ImageSortKey;
};

export const defaultImageSortKey: ImageSortKeyType = {
  imageSortKeyName: "None",
  imageSortKey: ImageSortKey.None,
};

export const availableImageSortKeys: ImageSortKeyType[] = [
  {
    imageSortKeyName: "File name",
    imageSortKey: ImageSortKey.FileName,
  },
  {
    imageSortKeyName: "Image category",
    imageSortKey: ImageSortKey.Category,
  },
];
