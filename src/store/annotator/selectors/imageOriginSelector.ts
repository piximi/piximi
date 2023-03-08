import { Annotator } from "types";
export const imageOriginSelector = ({
  annotator,
}: {
  annotator: Annotator;
}) => {
  return annotator.imageOrigin;
};
