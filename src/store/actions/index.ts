import { createAction } from "@reduxjs/toolkit";
import { Category } from "../../types/Category";
import { Image } from "../../types/Image";
import { Project } from "../../types/Project";

export const createProjectCategoryAction = createAction<{
  name: string;
  color: string;
}>("PROJECT_CREATE_CATEGORY");

export const createProjectImageAction = createAction<{ src: string }>(
  "PROJECT_CREATE_IMAGE"
);

export const createProjectImagesAction = createAction<{ images: Array<Image> }>(
  "PROJECT_CREATE_IMAGES"
);

export const createProjectAction = createAction<{ project: Project }>(
  "PROJECT_CREATE_PROJECT"
);

export const deleteProjectCategoryAction = createAction<{ category: Category }>(
  "PROJECT_DELETE_CATEGORY"
);

export const deleteProjectImageAction = createAction<{ image: Image }>(
  "PROJECT_DELETE_IMAGE"
);

export const openProjectAction = createAction<{ project: Project }>(
  "PROJECT_OPEN_PROJECT"
);

export const toggleCategoryVisibilityAction = createAction<{
  category: Category;
}>("PROJECT_TOGGLE_CATEGORY_VISIBILITY");

export const updateCategoryAction = createAction<{
  id: string;
  name: string;
  color: string;
}>("update-category");

export const updateCategoryColorAction = createAction<{
  category: Category;
  color: string;
}>("PROJECT_UPDATE_CATEGORY_COLOR");

export const updateCategoryDescriptionAction = createAction<{
  category: Category;
  description: string;
}>("PROJECT_UPDATE_CATEGORY_DESCRIPTION");

export const updateCategoryVisibilityAction = createAction<{
  category: Category;
  visible: boolean;
}>("PROJECT_UPDATE_CATEGORY_VISIBILITY");

export const updateImageBrightnessAction = createAction<{
  image: Image;
  brightness: number;
}>("PROJECT_UPDATE_IMAGE_BRIGHTNESS");

export const updateImageCategoryAction = createAction<{
  id: string;
  categoryId: string;
}>("update-image-category");

export const updateImageContrastAction = createAction<{
  image: Image;
  contrast: number;
}>("PROJECT_UPDATE_IMAGE_CONTRAST");

export const updateImagesCategoryAction = createAction<{
  images: Array<Image>;
  category: Category;
}>("PROJECT_UPDATE_IMAGES_CATEGORY");

export const updateImagesPartitionsAction = createAction<{
  trainingPercentage: Number;
  validationPercentage: Number;
}>("PROJECT_UPDATE_IMAGES_PARTITIONS");

export const updateImagesVisibilityAction = createAction<{
  images: Array<Image>;
  visible: boolean;
}>("PROJECT_UPDATE_IMAGES_VISIBILITY");

export const updateProjectNameAction = createAction<{ name: string }>(
  "PROJECT_UPDATE_NAME"
);
