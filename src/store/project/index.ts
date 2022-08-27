// Slice

export {
  projectSlice,
  setAnnotationCategories,
  updateCategoryVisibility,
  setAnnotationCategoryVisibility,
  createCategory,
  createAnnotationCategory,
  updateCategory,
  updateAnnotationCategory,
  updateOtherCategoryVisibility,
  updateOtherAnnotationCategoryVisibility,
  updateImageCategories,
  updateImageCategoryFromHighlighted,
} from "./projectSlice";

// Selectors

export { annotatedImagesSelector } from "./selectors/annotatedImagesSelector";
export { annotationCategoriesSelector } from "./selectors/annotationCategoriesSelector";
export { availableAnnotationColorsSelector } from "./selectors/availableAnnotationColorsSelector";
export { availableColorsSelector } from "./selectors/availableColorsSelector";
export { categoriesSelector } from "./selectors/categoriesSelector";
export { categorizedImagesSelector } from "./selectors/categorizedImagesSelector";
export { createdAnnotatorCategoriesSelector } from "./selectors/createdAnnotatorCategoriesSelector";
export { createdCategoriesCountSelector } from "./selectors/createdCategoriesCountSelector";
export { createdCategoriesSelector } from "./selectors/createdCategoriesSelector";
export { imageSortKeySelector } from "./selectors/imageSortKeySelector";
export { imagesSelector } from "./selectors/imagesSelector";
export { projectSelector } from "./selectors/projectSelector";
export { serializedProjectSelector } from "./selectors/serializedProjectSelector";
export { taskSelector } from "./selectors/taskSelector";
export { testImagesSelector } from "./selectors/testImagesSelector";
export { trainFlagSelector } from "./selectors/trainFlagSelector";
export { trainImagesSelector } from "./selectors/trainImagesSelector";
export { unannotatedImagesSelector } from "./selectors/unannotatedImagesSelector";
export { unknownAnnotationCategorySelector } from "./selectors/unknownAnnotationCategorySelector";
export { unknownCategorySelector } from "./selectors/unknownCategorySelector";
export { valImagesSelector } from "./selectors/valImagesSelector";
export { visibleAnnotationCategoriesSelector } from "./selectors/visibleAnnotationCategoriesSelector";
