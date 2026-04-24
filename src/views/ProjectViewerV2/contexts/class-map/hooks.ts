import { useContext } from "react";

import type { ModelClassMap } from "store/types";

import { ClassMapDialogContext } from "./ClassMapContext";

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
