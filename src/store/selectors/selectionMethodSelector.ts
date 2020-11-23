import { Settings } from "../../types/Settings";
import { SelectionMethod } from "../../types/SelectionMethod";

export const selectionMethodSelector = ({
  settings,
}: {
  settings: Settings;
}): SelectionMethod => {
  return settings.selectionMethod;
};
