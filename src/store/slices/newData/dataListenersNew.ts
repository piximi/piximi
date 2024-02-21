import { createListenerMiddleware } from "@reduxjs/toolkit";
import { NEW_UNKNOWN_CATEGORY_ID, TypedAppStartListening } from "types";
import { newDataSlice } from "./newDataSlice";
import { getDeferredProperty } from "store/entities/utils";
import { intersection } from "lodash";
import { DeferredEntity } from "store/entities/models";
import { NewImageType } from "types/ImageType";
import { projectSlice } from "../project";

export const newDataMiddleware = createListenerMiddleware();

export const startAppListening =
  newDataMiddleware.startListening as TypedAppStartListening;

startAppListening({
  actionCreator: newDataSlice.actions.deleteThings,
  effect: (action, listenerAPI) => {
    const state = listenerAPI.getState();
    const newData = state.newData;
    const project = state.project;
    let explicitThingIds: string[] = [];
    let implicitThingIds: string[] = [];

    if ("thingIds" in action.payload) {
      if (action.payload.thingIds === "all") {
        explicitThingIds = newData.things.ids as string[];
      } else if (action.payload.thingIds === "annotations") {
        explicitThingIds = newData.kinds.ids.reduce(
          (tIds: string[], kindId) => {
            if (kindId !== "Image") {
              tIds.push(
                ...getDeferredProperty(
                  newData.kinds.entities[kindId],
                  "containing"
                )
              );
            }
            return tIds;
          },
          []
        );
      } else {
        explicitThingIds = action.payload.thingIds;
      }
    } else if ("ofKinds" in action.payload) {
      action.payload.ofKinds.forEach((kindId) => {
        if (kindId in newData.kinds.entities) {
          explicitThingIds.push(
            ...getDeferredProperty(newData.kinds.entities[kindId], "containing")
          );
        }
      });
    } else {
      //"ofCategories" in action.payload
      action.payload.ofCategories.forEach((categoryId) => {
        if (categoryId in newData.categories.entities) {
          let containedThings: string[];
          if (categoryId === NEW_UNKNOWN_CATEGORY_ID) {
            const kind = action.payload.activeKind!;
            if (!newData.kinds.entities[kind]) {
              return;
            }
            const containedInKind = getDeferredProperty(
              newData.kinds.entities[kind],
              "containing"
            );
            containedThings = intersection(
              getDeferredProperty(
                newData.categories.entities[NEW_UNKNOWN_CATEGORY_ID],
                "containing"
              ),
              containedInKind
            );
          } else {
            containedThings = getDeferredProperty(
              newData.categories.entities[categoryId],
              "containing"
            );
          }
          explicitThingIds.push(...containedThings);
        }
      });
    }

    console.log("Explicit thing ids: ", explicitThingIds);

    for (const thingId of explicitThingIds) {
      const thing = newData.things.entities[thingId];
      if (!thing) continue;
      if (getDeferredProperty(thing, "kind") === "Image") {
        const containedThingIds = getDeferredProperty(
          thing as DeferredEntity<NewImageType>,
          "containing"
        );
        implicitThingIds.push(...containedThingIds);
      }
    }

    console.log("Implicit thing ids: ", implicitThingIds);

    const selectedThings = project.selectedThingIds;

    console.log("Selected things: ", selectedThings);

    const deletedThingsToDeselect = intersection(
      [...explicitThingIds, ...implicitThingIds],
      selectedThings
    );

    console.log("Things to be deselected: ", deletedThingsToDeselect);

    listenerAPI.dispatch(
      projectSlice.actions.deselectThings({ ids: deletedThingsToDeselect })
    );

    listenerAPI.unsubscribe();
    listenerAPI.dispatch(
      newDataSlice.actions.deleteThings({
        thingIds: explicitThingIds,
        disposeColorTensors: action.payload.disposeColorTensors,
        isPermanent: action.payload.isPermanent,
        preparedByListener: true,
      })
    );
    listenerAPI.subscribe();

    return;
  },
});
