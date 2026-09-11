import { createContext } from "react";

import type { Category } from "core/entities";

export const ClassMapDialogContext = createContext<{
  openDialog: ({
    projectCategories,
    modelClasses,
    actionCallback,
  }: {
    projectCategories: Category[];
    modelClasses: string[];
    actionCallback: any;
  }) => void;
}>({
  openDialog: (_config) => {},
});
