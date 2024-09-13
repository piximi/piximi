import { createListenerMiddleware } from "@reduxjs/toolkit";
import { TypedAppStartListening } from "store/types";
import { measurementsSlice } from "./measurementsSlice";
import { getDeferredProperty } from "store/entities/utils";
import { difference, intersection } from "lodash";
import { RecursivePartial } from "utils/common/types";
import { MeasurementOptions, ThingData } from "./types";
import { prepareThingData } from "components/measurements/utils";
import { isPendingReconciliation } from "store/data/helpers";
import { DeferredDictionary } from "store/entities";
import { Category } from "store/data/types";

export const measurementsMiddleware = createListenerMiddleware();

const startAppListening =
  measurementsMiddleware.startListening as TypedAppStartListening;

startAppListening({
  predicate: (action, currentState, previousState) => {
    return currentState.data !== previousState.data;
  },
  effect: async (action, listenerAPI) => {
    if (
      action.payload.hasOwnProperty("isPermanent") &&
      !action.payload.isPermanent
    )
      return;
    const { data: dataState, measurements: measurementState } =
      listenerAPI.getState();
    for await (const group of Object.values(measurementState.groups)) {
      const kind = dataState.kinds.entities[group.kind]?.saved;
      if (!kind) {
        //remove group from measurements
        listenerAPI.dispatch(
          measurementsSlice.actions.removeGroup({ groupId: group.id })
        );
        break;
      }

      const { splitUpdates, deletedCats } = updateCategories(
        group.splitStatus,
        kind.categories,
        dataState.categories.entities
      );

      listenerAPI.dispatch(
        measurementsSlice.actions.updateGroupSplitValues({
          groupId: group.id,
          updates: splitUpdates,
          remove: deletedCats,
        })
      );

      const groupThings = group.thingIds;
      const newThings = difference(kind.containing, groupThings);
      const deletedThings = difference(groupThings, kind.containing);
      if (!(newThings.length || deletedThings.length)) return;
      // Used to distinguish between actual new objects and objects which may have just changed kinds
      const unmeasuredThings = newThings.filter(
        (id) => !measurementState.data[id]
      );
      const unsavedThings: string[] = [];
      if (unmeasuredThings.length) {
        // Turns measurements off -- Users need to manually recalculate new values
        const inactiveMeasurements = resetMeasurements(
          group.measurementsStatus
        );
        listenerAPI.dispatch(
          measurementsSlice.actions.updateGroupMeasurementState({
            groupId: group.id,
            updates: inactiveMeasurements,
          })
        );

        // For new measurements, data needs to be computed
        const preparedThings: ThingData = {};

        for await (const thingId of unmeasuredThings) {
          if (isPendingReconciliation(dataState.things.entities[thingId])) {
            unsavedThings.push(thingId);
            continue;
          }
          const thing = dataState.things.entities[thingId].saved;
          const preparedThing = await prepareThingData(thing);
          preparedThings[thingId] = preparedThing;
        }
        listenerAPI.dispatch(
          measurementsSlice.actions.updateMeasurements({
            dataDict: preparedThings,
          })
        );
      }
      listenerAPI.dispatch(
        measurementsSlice.actions.updateGroupThingIds({
          groupId: group.id,
          thingIds: difference(kind.containing, unsavedThings), // Dont add things which are currently being changed
        })
      );
      const trulyDeleted = deletedThings.filter(
        (id) => !dataState.things.entities[id]
      );
      if (trulyDeleted.length) {
        listenerAPI.dispatch(
          measurementsSlice.actions.removeThingMeasurements({
            thingIds: trulyDeleted,
          })
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
    {}
  );
};

const updateCategories = (
  status: MeasurementOptions,
  kindCategories: string[],
  categoryEntities: DeferredDictionary<Category>
) => {
  const groupCats = status["categoryId"].children!;
  const newCats = difference(kindCategories, groupCats);
  const deletedCats = difference(groupCats, kindCategories);
  const persistingCats = intersection(
    status["categoryId"].children!,
    kindCategories
  );

  const newNames = persistingCats.reduce(
    (newNames: { id: string; name: string }[], id) => {
      if (status[id]!.name !== categoryEntities[id]!.saved.name) {
        newNames.push({
          id,
          name: categoryEntities[id]!.saved.name,
        });
      }
      return newNames;
    },
    []
  );

  const splitUpdates: RecursivePartial<MeasurementOptions> = {};
  if (newCats.length || deletedCats.length || newNames) {
    splitUpdates["categoryId"] = {
      ...status["categoryId"],
      children: kindCategories,
    };
    newCats.forEach((id) => {
      splitUpdates[id] = {
        id,
        name: getDeferredProperty(categoryEntities[id], "name"),
        state: "off",
        parent: "categoryId",
      };
    });
    newNames.forEach(({ id, name }) => {
      splitUpdates[id] = {
        ...status[id],
        name,
      };
    });
  }

  return { splitUpdates, deletedCats };
};
