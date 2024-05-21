import * as tf from "@tensorflow/tfjs";
import { MeasurementsData } from "store/measurements/types";
import { getIntensityMeasurement } from "utils/measurements/helpers";

/* eslint-disable-next-line no-restricted-globals */
self.onmessage = async (
  e: MessageEvent<{
    currentMeasurements: MeasurementsData;
    activeMeasurements: string[];
    thingIds: string[];
  }>
) => {
  const { currentMeasurements, activeMeasurements, thingIds } = e.data;
  const newMeasurements: Record<string, Record<string, number>> = {};
  activeMeasurements.forEach((measurement) => {
    const measurementdetails = measurement.split("-channel-");
    const measurementName = measurementdetails[0];
    const channel = +measurementdetails[1];

    thingIds.forEach((thingId) => {
      if (
        thingId in currentMeasurements &&
        measurement in currentMeasurements[thingId].measurements
      ) {
        return;
      } else {
        const thingChannelData = currentMeasurements[thingId].channelData!;

        const measuredChannel = tf.tidy(() => {
          return tf
            .tensor2d(thingChannelData)
            .slice(channel, 1)
            .squeeze() as tf.Tensor1D;
        });

        const result = getIntensityMeasurement(
          measuredChannel,
          measurementName
        );
        if (result === undefined)
          throw new Error(
            `Error calculating ${measurementName} on channel ${channel}`
          );
        if (thingId in newMeasurements) {
          newMeasurements[thingId][measurement] = result;
        } else {
          newMeasurements[thingId] = { [measurement]: result };
        }
        measuredChannel.dispose();
      }
    });
  });
  /* eslint-disable-next-line no-restricted-globals */
  self.postMessage(newMeasurements);
};

export {};
