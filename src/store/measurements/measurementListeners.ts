import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import { TypedAppStartListening } from "store/types";
import { measurementsSlice } from "./measurementsSlice";
import { getCompleteEntity, getDeferredProperty } from "store/entities/utils";
import { Thing } from "store/data/types";
import { intersection } from "lodash";
import {
  getIntensityMeasurement,
  getObjectMaskData,
  prepareChannels,
} from "utils/measurements/helpers";
import { isObjectEmpty } from "utils/common/helpers";
import { Tensor1D, Tensor2D, tidy } from "@tensorflow/tfjs";
import { decodeAnnotation } from "utils/annotator/rle";

export const measurementsMiddleware = createListenerMiddleware();

const startAppListening =
  measurementsMiddleware.startListening as TypedAppStartListening;

startAppListening({
  actionCreator: measurementsSlice.actions.createTable,
  effect: async (action, listenerAPI) => {
    const { data: dataState, measurements: measurementState } =
      listenerAPI.getState();
    const kindId = action.payload.kind;
    const thingIds = getDeferredProperty(
      dataState.kinds.entities[kindId],
      "containing"
    );
    if (!thingIds) return;
    const measurementData = measurementState.measurementData;
    const channelDataDict: Record<string, Tensor2D> = {};
    for await (const thingId of thingIds) {
      if (thingId in measurementData) continue;
      const thing = getCompleteEntity(dataState.things.entities[thingId])!;
      let channelData: Tensor2D;
      if ("decodedMask" in thing) {
        const fullChannelData = prepareChannels(thing.data);

        channelData = await getObjectMaskData(
          fullChannelData,
          thing.decodedMask!
        );
      } else if ("encodedMask" in thing) {
        const decodedAnnotation = decodeAnnotation(thing);

        const fullChannelData = prepareChannels(thing.data);

        channelData = await getObjectMaskData(
          fullChannelData,
          decodedAnnotation.decodedMask
        );

        fullChannelData.dispose();
      } else {
        channelData = prepareChannels(thing.data);
      }
      channelDataDict[thingId] = channelData;
    }
    listenerAPI.dispatch(
      measurementsSlice.actions.updateMeasurements({ channelDataDict })
    );
  },
});

startAppListening({
  matcher: isAnyOf(
    measurementsSlice.actions.updateTableMeasurementState,
    measurementsSlice.actions.updateTableSplitState
  ),
  effect: async (action, listenerAPI) => {
    const { data: dataState, measurements: measurementsState } =
      listenerAPI.getState();
    const measurementData = measurementsState.measurementData;
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

    const newMeasurements: Record<string, Record<string, number>> = {};
    includedMeasurements.forEach((measurement) => {
      const measurementdetails = measurement.split("-channel-");
      const measurementName = measurementdetails[0];
      const channel = +measurementdetails[1];

      splitThings.forEach((thing) => {
        if (
          thing.id in measurementData &&
          measurement in measurementData[thing.id].measurements
        ) {
          return;
        } else {
          const thingChannelData = measurementData[thing.id].channelData!;

          const measuredChannel = tidy(() => {
            return thingChannelData.slice(channel, 1).squeeze() as Tensor1D;
          });

          const result = getIntensityMeasurement(
            measuredChannel,
            measurementName
          );

          if (result === undefined)
            throw new Error(
              `Error calculating ${measurementName} on channel ${channel}`
            );
          if (thing.id in newMeasurements) {
            newMeasurements[thing.id][measurement] = result;
          } else {
            newMeasurements[thing.id] = { [measurement]: result };
          }
          measuredChannel.dispose();
        }
      });
    });

    if (!isObjectEmpty(newMeasurements)) {
      listenerAPI.dispatch(
        measurementsSlice.actions.updateMeasurements({
          measurementsDict: newMeasurements,
        })
      );
    }
  },
});
