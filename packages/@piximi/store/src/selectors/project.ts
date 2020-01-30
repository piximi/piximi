import {Category, Image} from "@piximi/types";

export const categoriesSelector = ({project}): Array<Category> => {
  return project.categories.filter((category: Category) => {
    return category.identifier !== "00000000-0000-0000-0000-00000000000";
  });
};

export const categorizedImagesSelector = ({project}): Array<Image> => {
  return project.images.filter((image: Image) => {
    return image.categoryIdentifier !== "00000000-0000-0000-0000-00000000000";
  });
};
