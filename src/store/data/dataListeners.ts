import { createListenerMiddleware } from "@reduxjs/toolkit";

import { dataSlice } from "./dataSlice";

import { applicationSettingsSlice } from "store/applicationSettings";

import { createRenderedTensor } from "utils/tensorUtils";

import { ImageMetadata } from "./types";
import { TypedAppStartListening } from "store/types";
import _ from "lodash";
import { classifierSlice } from "store/classifier/classifierSlice";
import { getDefaultModelInfo } from "utils/models/classification/utils";
import { recursiveAssign } from "utils/objectUtils";
import { projectSlice } from "store/project";

export const dataMiddleware = createListenerMiddleware();

const startAppListening =
  dataMiddleware.startListening as TypedAppStartListening;

startAppListening({
  predicate: (action, currentState, previousState) => {
    return currentState.data.kinds.ids !== previousState.data.kinds.ids;
  },
  effect: async (action, listenerAPI) => {
    const { data: dataState, project: projectState } = listenerAPI.getState();
    const currentDataStateKinds = dataState.kinds.ids;

    const previousDataStateKinds =
      listenerAPI.getOriginalState().data.kinds.ids;

    const deletedKinds = _.difference(
      previousDataStateKinds,
      currentDataStateKinds,
    );
    const addedKinds = _.difference(
      currentDataStateKinds,
      previousDataStateKinds,
    );

    // Classifier slice reactions
    const defaultModelInfo = getDefaultModelInfo();
    recursiveAssign(defaultModelInfo, {
      preprocessSettings: {
        inputShape: { channels: projectState.imageChannels },
      },
    });
    listenerAPI.dispatch(
      classifierSlice.actions.updateKindClassifiers({
        changes: {
          del: deletedKinds,
          add: addedKinds,
          presetInfo: addedKinds.map(() => {
            const defaultModelInfo = getDefaultModelInfo();
            defaultModelInfo.preprocessSettings.inputShape.channels =
              projectState.imageChannels ?? 1;
            return {
              modelNameOrArch: 0,
              modelInfoDict: { "base-model": defaultModelInfo },
            };
          }),
        },
      }),
    );

    // Project slice reactions
    addedKinds.forEach((kind) =>
      listenerAPI.dispatch(projectSlice.actions.addKindToItemFilters(kind)),
    );
    deletedKinds.forEach((kind) =>
      listenerAPI.dispatch(
        projectSlice.actions.removeKindFromItemFilters(kind),
      ),
    );
  },
});
