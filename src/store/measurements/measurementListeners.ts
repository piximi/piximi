import { createListenerMiddleware, Dictionary } from "@reduxjs/toolkit";
import { difference, intersection } from "lodash";

import { applicationSettingsSlice } from "store/applicationSettings";
import { measurementsSlice } from "./measurementsSlice";

import { prepareThingData } from "views/MeasurementView/utils";

import { Category } from "store/data/types";
import { TypedAppStartListening } from "store/types";
import { RecursivePartial } from "utils/common/types";
import { MeasurementOptions, ThingData } from "./types";

export const measurementsMiddleware = createListenerMiddleware();

const startAppListening =
  measurementsMiddleware.startListening as TypedAppStartListening;

startAppListening({
  actionCreator: applicationSettingsSlice.actions.resetApplicationState,
  effect: (action, listenerAPI) => {
    listenerAPI.dispatch(measurementsSlice.actions.resetMeasurements());
  },
});

startAppListening({
  predicate: (action, currentState, previousState) => {
    return currentState.data !== previousState.data;
  },
  effect: async (action, listenerAPI) => {
    if (
      !action.payload ||
      (action.payload.hasOwnProperty("isPermanent") &&
        !action.payload.isPermanent)
    )
      return;
    const { data: dataState, measurements: measurementState } =
      listenerAPI.getState();
    for await (const group of Object.values(measurementState.groups)) {
      const kind = dataState.kinds.entities[group.kind];
      if (!kind) {
        //remove group from measurements
        listenerAPI.dispatch(
          measurementsSlice.actions.removeGroup({ groupId: group.id }),
        );
        break;
      }

      const { splitUpdates, deletedCats } = updateCategories(
        group.splitStates,
        kind.categories,
        dataState.categories.entities,
      );

      listenerAPI.dispatch(
        measurementsSlice.actions.updateGroupSplitValues({
          groupId: group.id,
          updates: splitUpdates,
          remove: deletedCats,
        }),
      );

      const groupThings = group.thingIds;
      const newThings = difference(kind.containing, groupThings);
      const deletedThings = difference(groupThings, kind.containing);
      if (!(newThings.length || deletedThings.length)) return;
      // Used to distinguish between actual new objects and objects which may have just changed kinds
      const unmeasuredThings = newThings.filter(
        (id) => !measurementState.data[id],
      );

      if (unmeasuredThings.length) {
        // Turns measurements off -- Users need to manually recalculate new values
        const inactiveMeasurements = resetMeasurements(group.measurementStates);
        listenerAPI.dispatch(
          measurementsSlice.actions.updateGroupMeasurementState({
            groupId: group.id,
            updates: inactiveMeasurements,
          }),
        );

        // For new measurements, data needs to be computed
        const preparedThings: ThingData = {};

        for await (const thingId of unmeasuredThings) {
          const thing = dataState.things.entities[thingId]!;
          const preparedThing = await prepareThingData(thing);
          preparedThings[thingId] = preparedThing;
        }
        listenerAPI.dispatch(
          measurementsSlice.actions.updateMeasurements({
            dataDict: preparedThings,
          }),
        );
      }
      listenerAPI.dispatch(
        measurementsSlice.actions.updateGroupThingIds({
          groupId: group.id,
          thingIds: kind.containing,
        }),
      );
      const trulyDeleted = deletedThings.filter(
        (id) => !dataState.things.entities[id],
      );
      if (trulyDeleted.length) {
        listenerAPI.dispatch(
          measurementsSlice.actions.removeThingMeasurements({
            thingIds: trulyDeleted,
          }),
        );
      }
    }
  },
});

const resetMeasurements = (measurements: MeasurementOptions) => {
  return Object.keys(measurements).reduce(
    (newOptions: MeasurementOptions, id) => {
      newOptions[id] = { ...measurements[id], state: "off" };
      return newOptions;
    },
    {},
  );
};

const updateCategories = (
  state: MeasurementOptions,
  kindCategories: string[],
  categoryEntities: Dictionary<Category>,
) => {
  const groupCats = state["categoryId"].children!;
  const newCats = difference(kindCategories, groupCats);
  const deletedCats = difference(groupCats, kindCategories);
  const persistingCats = intersection(
    state["categoryId"].children!,
    kindCategories,
  );

  const newNames = persistingCats.reduce(
    (newNames: { id: string; name: string }[], id) => {
      if (state[id]!.name !== categoryEntities[id]!.name) {
        newNames.push({
          id,
          name: categoryEntities[id]!.name,
        });
      }
      return newNames;
    },
    [],
  );

  const splitUpdates: RecursivePartial<MeasurementOptions> = {};
  if (newCats.length || deletedCats.length || newNames) {
    splitUpdates["categoryId"] = {
      ...state["categoryId"],
      children: kindCategories,
    };
    newCats.forEach((id) => {
      splitUpdates[id] = {
        id,
        name: categoryEntities[id]!.name,
        state: "off",
        parent: "categoryId",
      };
    });
    newNames.forEach(({ id, name }) => {
      splitUpdates[id] = {
        ...state[id],
        name,
      };
    });
  }

  return { splitUpdates, deletedCats };
};
