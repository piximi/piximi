import { Annotator } from "types";
export const thresholdAnnotationValueSelector = ({
  annotator,
}: {
  annotator: Annotator;
}) => {
  return annotator.thresholdAnnotationValue;
};
