import { useState } from "react";

import { ClassMapDialogContext } from "./ClassMapContext";
import { ClassMapDialog } from "./ClassMapDialog";

import type { ReactElement } from "react";

import type { Category } from "core/entities";
import type { ModelClassMap } from "core/dl/classification/types";

export const ClassMapDialogProvider = ({
  children,
}: {
  children: ReactElement;
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{
    projectCategories: Category[];
    modelClasses: string[];
    actionCallback: any;
  }>({ projectCategories: [], modelClasses: [], actionCallback: undefined });

  const openDialog = ({
    projectCategories,
    modelClasses,
    actionCallback,
  }: {
    projectCategories: Category[];
    modelClasses: string[];
    actionCallback: any;
  }) => {
    setDialogOpen(true);
    setDialogConfig({ projectCategories, modelClasses, actionCallback });
  };

  const resetDialog = () => {
    setDialogOpen(false);
    setDialogConfig({
      projectCategories: [],
      modelClasses: [],
      actionCallback: undefined,
    });
  };

  const onConfirm = (catMap: ModelClassMap) => {
    resetDialog();
    dialogConfig.actionCallback(catMap);
  };

  const onDismiss = () => {
    resetDialog();
    dialogConfig.actionCallback(false);
  };

  return (
    <ClassMapDialogContext.Provider value={{ openDialog }}>
      <ClassMapDialog
        open={dialogOpen}
        projectCategories={dialogConfig.projectCategories}
        modelClasses={dialogConfig.modelClasses}
        onConfirm={onConfirm}
        onDismiss={onDismiss}
      />
      {children}
    </ClassMapDialogContext.Provider>
  );
};
