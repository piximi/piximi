import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import { TypedAppStartListening } from "store/types";
import { measurementsSlice } from "./measurementsSlice";
import { getCompleteEntity } from "store/entities/utils";
import { Thing } from "store/data/types";
import { intersection } from "lodash";
import { MeasurementsData } from "./types";
import { getMeasurement } from "utils/measurements/helpers";
import { isObjectEmpty } from "utils/common/helpers";

export const measurementsMiddleware = createListenerMiddleware();

const startAppListening =
  measurementsMiddleware.startListening as TypedAppStartListening;

startAppListening({
  matcher: isAnyOf(
    measurementsSlice.actions.updateTableMeasurementState,
    measurementsSlice.actions.updateTableSplitState
  ),
  effect: async (action, listenerAPI) => {
    const { data: dataState, measurements: measurementsState } =
      listenerAPI.getState();
    const currentMeasurements = measurementsState.measurementData;
    const tableId = action.payload.tableId;
    const activeTable = measurementsState.tables[tableId];
    const tableKind = activeTable.kind;
    const includeSplits: string[] = [];
    const activeSplits = Object.values(activeTable.splitStatus).filter(
      (split) => split.state === "on"
    );
    activeSplits.forEach((split) => includeSplits.push(split.id.toLowerCase()));

    const activeMeasurements = Object.values(
      activeTable.measurementsStatus
    ).filter((measurement) => measurement.state === "on");
    const includedMeasurements = activeMeasurements.map(
      (measurement) => measurement.id
    );

    const splitThings = Object.values(dataState.things.entities).reduce(
      (split: Thing[], thingEntity) => {
        const thing = getCompleteEntity(thingEntity)!;
        if (thing.kind === tableKind) {
          const identifiers = [
            thing.categoryId.toLowerCase(),
            thing.partition.toLowerCase(),
          ];
          const matchedIdentifiers = intersection(identifiers, includeSplits);
          if (matchedIdentifiers.length > 0) {
            split.push(thing);
          }
        }
        return split;
      },
      []
    );

    const newMeasurements: MeasurementsData = {};
    includedMeasurements.forEach((measurement) => {
      const measurementdetails = measurement.split("-channel-");
      const measurementName = measurementdetails[0];
      const channel = +measurementdetails[1];

      splitThings.forEach((thing) => {
        if (
          thing.id in currentMeasurements &&
          measurement in currentMeasurements[thing.id]
        ) {
          return;
        } else {
          const result = getMeasurement(thing.data, channel, measurementName);
          if (result === undefined)
            throw new Error(
              `Error calculating ${measurementName} on channel ${channel}`
            );
          if (thing.id in newMeasurements) {
            newMeasurements[thing.id][measurement] = result;
          } else {
            newMeasurements[thing.id] = { [measurement]: result };
          }
        }
      });
    });

    if (!isObjectEmpty(newMeasurements)) {
      listenerAPI.dispatch(
        measurementsSlice.actions.updateMeasurements({
          measurements: newMeasurements,
        })
      );
    }
  },
});
