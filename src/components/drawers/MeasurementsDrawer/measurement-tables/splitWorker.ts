import * as tf from "@tensorflow/tfjs";
import { MeasurementsData } from "store/measurements/types";
import {
  getEQPC,
  getIntensityMeasurement,
  getObjectFormFactor,
  getPerimeterFromMask,
} from "utils/measurements/helpers";

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
    if (measurement.includes("intensity")) {
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
    } else if (measurement.includes("geometry")) {
      if (measurement.includes("area")) {
        thingIds.forEach((thingId) => {
          if (
            thingId in currentMeasurements &&
            measurement in currentMeasurements[thingId].measurements
          ) {
            return;
          } else {
            const thingChannelData = currentMeasurements[thingId].channelData!;
            const result = thingChannelData[0].length;

            if (result === undefined)
              throw new Error(`Error calculating area `);
            if (thingId in newMeasurements) {
              newMeasurements[thingId][measurement] = result;
            } else {
              newMeasurements[thingId] = { [measurement]: result };
            }
          }
        });
      }
      if (measurement.includes("perimeter")) {
        thingIds.forEach((thingId) => {
          if (
            thingId in currentMeasurements &&
            measurement in currentMeasurements[thingId].measurements
          ) {
            return;
          } else {
            const result = getPerimeterFromMask(
              currentMeasurements[thingId].maskData!,
              currentMeasurements[thingId].maskShape!
            );
            if (result === undefined)
              throw new Error(`Error calculating area `);
            if (thingId in newMeasurements) {
              newMeasurements[thingId][measurement] = result;
            } else {
              newMeasurements[thingId] = { [measurement]: result };
            }
          }
        });
      }
      if (measurement.includes("extent")) {
        thingIds.forEach((thingId) => {
          if (
            thingId in currentMeasurements &&
            measurement in currentMeasurements[thingId].measurements
          ) {
            return;
          } else {
            const thingChannelData = currentMeasurements[thingId].channelData!;
            const area = thingChannelData[0].length;
            const shape = currentMeasurements[thingId].maskShape!;
            const bboxArea = shape.width * shape.height;
            const result = area / bboxArea;
            if (result === undefined)
              throw new Error(`Error calculating area `);
            if (thingId in newMeasurements) {
              newMeasurements[thingId][measurement] = result;
            } else {
              newMeasurements[thingId] = { [measurement]: result };
            }
          }
        });
      }
      if (measurement.includes("bbox")) {
        thingIds.forEach((thingId) => {
          if (
            thingId in currentMeasurements &&
            measurement in currentMeasurements[thingId].measurements
          ) {
            return;
          } else {
            const shape = currentMeasurements[thingId].maskShape!;
            const bboxArea = shape.width * shape.height;
            const result = bboxArea;
            if (result === undefined)
              throw new Error(`Error calculating area `);
            if (thingId in newMeasurements) {
              newMeasurements[thingId][measurement] = result;
            } else {
              newMeasurements[thingId] = { [measurement]: result };
            }
          }
        });
      }
      if (measurement.includes("eqpc")) {
        thingIds.forEach((thingId) => {
          if (
            thingId in currentMeasurements &&
            measurement in currentMeasurements[thingId].measurements
          ) {
            return;
          } else {
            const result = getEQPC(
              currentMeasurements[thingId].channelData![0].length
            );

            if (result === undefined)
              throw new Error(`Error calculating area `);
            if (thingId in newMeasurements) {
              newMeasurements[thingId][measurement] = result;
            } else {
              newMeasurements[thingId] = { [measurement]: result };
            }
          }
        });
      }

      if (measurement.includes("ped")) {
        thingIds.forEach((thingId) => {
          if (
            thingId in currentMeasurements &&
            measurement in currentMeasurements[thingId].measurements
          ) {
            return;
          } else {
            const per = getPerimeterFromMask(
              currentMeasurements[thingId].maskData!,
              currentMeasurements[thingId].maskShape!
            );

            const result = per / Math.PI;

            if (result === undefined)
              throw new Error(`Error calculating area `);
            if (thingId in newMeasurements) {
              newMeasurements[thingId][measurement] = result;
            } else {
              newMeasurements[thingId] = { [measurement]: result };
            }
          }
        });
      }
      if (measurement.includes("sphericity")) {
        thingIds.forEach((thingId) => {
          if (
            thingId in currentMeasurements &&
            measurement in currentMeasurements[thingId].measurements
          ) {
            return;
          } else {
            const result = getObjectFormFactor(
              currentMeasurements[thingId].channelData![0].length,
              currentMeasurements[thingId].maskData!,
              currentMeasurements[thingId].maskShape!
            );
            if (result === undefined)
              throw new Error(`Error calculating area `);
            if (thingId in newMeasurements) {
              newMeasurements[thingId][measurement] = result;
            } else {
              newMeasurements[thingId] = { [measurement]: result };
            }
          }
        });
      }
      if (measurement.includes("compactness")) {
        thingIds.forEach((thingId) => {
          if (
            thingId in currentMeasurements &&
            measurement in currentMeasurements[thingId].measurements
          ) {
            return;
          } else {
            const formFactor = getObjectFormFactor(
              currentMeasurements[thingId].channelData![0].length,
              currentMeasurements[thingId].maskData!,
              currentMeasurements[thingId].maskShape!
            );

            const result = 1 / formFactor;
            if (result === undefined)
              throw new Error(`Error calculating area `);
            if (thingId in newMeasurements) {
              newMeasurements[thingId][measurement] = result;
            } else {
              newMeasurements[thingId] = { [measurement]: result };
            }
          }
        });
      }
    }
  });
  /* eslint-disable-next-line no-restricted-globals */
  self.postMessage(newMeasurements);
};

export {};
