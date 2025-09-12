import { ReactElement } from "react";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

export type OperationType = {
  icon: (color: string) => ReactElement;
  name: string;
  description: string;
  options?: ReactElement;
  action?: () => void;
  hotkey: string;
  mobile?: boolean;
  helpContext?: HelpItem;
};
