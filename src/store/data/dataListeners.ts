import { createListenerMiddleware } from "@reduxjs/toolkit";

import { dataSlice } from "./dataSlice";

import { applicationSettingsSlice } from "store/applicationSettings";

import { createRenderedTensor } from "utils/tensorUtils";

import { ImageObject } from "./types";
import { TypedAppStartListening } from "store/types";
import _ from "lodash";
import { classifierSlice } from "store/classifier/classifierSlice";
import { getDefaultModelInfo } from "utils/models/classification/utils";
import { recursiveAssign } from "utils/objectUtils";

export const dataMiddleware = createListenerMiddleware();

const startAppListening =
  dataMiddleware.startListening as TypedAppStartListening;

startAppListening({
  actionCreator: dataSlice.actions.deleteThings,
  effect: (action, listenerAPI) => {
    const state = listenerAPI.getState();
    const data = state.data;
    let explicitThingIds: string[] = [];

    if ("thingIds" in action.payload) {
      if (action.payload.thingIds === "all") {
        explicitThingIds = data.things.ids as string[];
      } else if (action.payload.thingIds === "annotations") {
        explicitThingIds = data.kinds.ids.reduce((tIds: string[], kindId) => {
          if (kindId !== "Image") {
            tIds.push(...data.kinds.entities[kindId]!.containing);
          }
          return tIds;
        }, []);
      } else {
        explicitThingIds = action.payload.thingIds;
      }
    } else if ("ofKinds" in action.payload) {
      action.payload.ofKinds.forEach((kindId) => {
        if (kindId in data.kinds.entities) {
          explicitThingIds.push(...data.kinds.entities[kindId]!.containing);
        }
      });
    } else {
      //"ofCategories" in action.payload
      action.payload.ofCategories.forEach((categoryId) => {
        if (categoryId in data.categories.entities) {
          const containedThings =
            data.categories.entities[categoryId]!.containing;

          explicitThingIds.push(...containedThings);
        }
      });
    }

    listenerAPI.unsubscribe();
    listenerAPI.dispatch(
      dataSlice.actions.deleteThings({
        thingIds: explicitThingIds,
        disposeColorTensors: action.payload.disposeColorTensors,
        preparedByListener: true,
      }),
    );
    listenerAPI.subscribe();

    return;
  },
});

startAppListening({
  actionCreator: dataSlice.actions.updateThings,
  effect: async (action, listenerAPI) => {
    const { updates } = action.payload;
    const { data: dataState } = listenerAPI.getState();

    const srcUpdates: Array<{ id: string } & Partial<ImageObject>> = [];
    let renderedSrcs: string[] = [];
    const numImages = updates.length;
    let imageNumber = 1;
    for await (const update of updates) {
      const { id: imageId, ...changes } = update;
      if ("colors" in changes && changes.colors) {
        const colors = changes.colors;
        const image = dataState.things.entities[imageId]! as ImageObject;

        const colorsEditable = {
          range: { ...colors.range },
          visible: { ...colors.visible },
          color: colors.color,
        };
        renderedSrcs = await createRenderedTensor(
          image.data,
          colorsEditable,
          image.bitDepth,
          undefined,
        );

        srcUpdates.push({ id: imageId, src: renderedSrcs[image.activePlane] });

        listenerAPI.dispatch(
          applicationSettingsSlice.actions.setLoadMessage({
            message: `Updating image ${imageNumber} of ${numImages}`,
          }),
        );
        imageNumber++;
      }
    }

    if (srcUpdates.length !== 0) {
      listenerAPI.unsubscribe();
      listenerAPI.dispatch(
        dataSlice.actions.updateThings({
          updates: srcUpdates,
        }),
      );
      listenerAPI.subscribe();
    }
    listenerAPI.dispatch(
      applicationSettingsSlice.actions.setLoadMessage({
        message: "",
      }),
    );
  },
});

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
  },
});
