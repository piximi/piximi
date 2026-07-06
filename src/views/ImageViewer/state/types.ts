export type ImageViewerDataState = {
  imageStack: string[];
  activeImageId?: string;
  previousImageId?: string;
  selectedCategoryId: string;
  highlightedCategory?: string;
  activeAnnotationIds: Array<string>;
  selectedAnnotationIds: Array<string>;

  zLinking: { active: boolean; annIds: Record<string, string> };
  hasUnsavedChanges?: boolean;
  imageIsLoading?: boolean;
};
