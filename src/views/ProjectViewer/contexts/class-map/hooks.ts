import { useContext } from "react";

import { ClassMapDialogContext } from "./ClassMapContext";

import type { ModelClassMap } from "core/dl/classification/types";

export const useClassMapDialog = () => {
  const { openDialog } = useContext(ClassMapDialogContext);

  const getClassMap = (
    options: Omit<Parameters<typeof openDialog>[0], "actionCallback">,
  ): Promise<ModelClassMap | false> =>
    new Promise((res) => {
      openDialog({
        actionCallback: res,
        ...options,
      });
    });

  return { getClassMap };
};
