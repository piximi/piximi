import {Category, Image, Partition, Project, Score} from "@piximi/types";
import {createAction} from "@reduxjs/toolkit";

export const createCategoryAction = createAction<{category: Category}>(
  "PROJECT_CREATE_CATEGORY"
);

export const createImageAction = createAction<{image: Image}>(
  "PROJECT_CREATE_IMAGE"
);

export const createImagesAction = createAction<{images: Array<Image>}>(
  "PROJECT_CREATE_IMAGES"
);

export const createProjectAction = createAction<{project: Project}>(
  "PROJECT_CREATE_PROJECT"
);

export const deleteCategoryAction = createAction<{category: Category}>(
  "PROJECT_DELETE_CATEGORY"
);

export const deleteImageAction = createAction<{image: Image}>(
  "PROJECT_DELETE_IMAGE"
);

export const openProjectAction = createAction<{project: Project}>(
  "PROJECT_OPEN_PROJECT"
);

export const toggleCategoryVisibilityAction = createAction<{
  category: Category;
}>("PROJECT_TOGGLE_CATEGORY_VISIBILITY");

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
  image: Image;
  category: Category;
}>("PROJECT_UPDATE_IMAGE_CATEGORY");

export const updateImageContrastAction = createAction<{
  image: Image;
  contrast: number;
}>("PROJECT_UPDATE_IMAGE_CONTRAST");

export const updateImagesCategoryAction = createAction<{
  images: Array<Image>;
  category: Category;
}>("PROJECT_UPDATE_IMAGES_CATEGORY");

export const updateImagesPartitionsAction = createAction<{
  images: Array<Image>;
  partitions: Array<Partition>;
}>("PROJECT_UPDATE_IMAGES_PARTITIONS");

export const updateImagesVisibilityAction = createAction<{
  images: Array<Image>;
  visible: boolean;
}>("PROJECT_UPDATE_IMAGES_VISIBILITY");

export const updateProjectNameAction = createAction<{name: string}>(
  "PROJECT_UPDATE_NAME"
);
