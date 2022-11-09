import { Annotator } from "types";
export const exposureSelector = ({ annotator }: { annotator: Annotator }) => {
  return annotator.exposure;
};
