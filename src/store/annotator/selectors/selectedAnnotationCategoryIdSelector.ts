import { Annotator } from "types";

export const selectedAnnotationCategoryIdSelector = ({
  annotator,
}: {
  annotator: Annotator;
}) => {
  return annotator.selectedCategoryId;
};
