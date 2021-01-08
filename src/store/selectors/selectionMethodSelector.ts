import { Settings } from "../../types/Settings";
import { ImageViewerOperation } from "../../types/SelectionMethod";

export const selectionMethodSelector = ({
  settings,
}: {
  settings: Settings;
}): ImageViewerOperation => {
  return settings.selectionMethod;
};
