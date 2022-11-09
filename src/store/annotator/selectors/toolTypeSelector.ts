import { Annotator, ToolType } from "types";

export const toolTypeSelector = ({
  annotator,
}: {
  annotator: Annotator;
}): ToolType => {
  return annotator.toolType;
};
