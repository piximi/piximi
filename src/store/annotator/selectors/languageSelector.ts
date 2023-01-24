import { Annotator } from "types";
export const languageSelector = ({ annotator }: { annotator: Annotator }) => {
  return annotator.language;
};
