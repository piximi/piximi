import { tidy, tensor2d, Tensor1D } from "@tensorflow/tfjs";
import { expose } from "comlink";

import * as Comlink from "comlink";

import {
  getEQPC,
  getIntensityMeasurement,
  getObjectFormFactor,
  getPerimeterFromMask,
} from "utils/measurements/utils";

import { MeasurementsData } from "store/measurements/types";
import { tensor4d } from "@tensorflow/tfjs";
import { prepareThingData } from "../utils";
import { ThingData } from "store/measurements/types";
import { DataArray } from "store/data/types";

const measurementWorker = {
  async runMeasurement(
    {
      currentMeasurements,
      activeMeasurements,
      thingIds,
    }: {
      currentMeasurements: MeasurementsData;
      activeMeasurements: string[];
      thingIds: string[];
    },
    onProgress: (progress: number) => void
  ) {
    console.log("split message");
    // const { currentMeasurements, activeMeasurements, thingIds } = e.data;
    const newMeasurements: Record<string, Record<string, number>> = {};
    const measurementCount = activeMeasurements.length;
    const thingCount = thingIds.length;
    const postLoadPercent = (num: number) => {
      onProgress(Math.floor((num / (measurementCount * thingCount)) * 100));
    };
    let numCounted = 0;
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
            const measuredChannel = tidy(() => {
              return tensor2d(thingChannelData)
                .slice(channel, 1)
                .squeeze() as Tensor1D;
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

          postLoadPercent(++numCounted);
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
              const thingChannelData =
                currentMeasurements[thingId].channelData!;
              const result = thingChannelData[0].length;

              if (result === undefined)
                throw new Error(`Error calculating area `);
              if (thingId in newMeasurements) {
                newMeasurements[thingId][measurement] = result;
              } else {
                newMeasurements[thingId] = { [measurement]: result };
              }
            }

            postLoadPercent(++numCounted);
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

            postLoadPercent(++numCounted);
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
              const thingChannelData =
                currentMeasurements[thingId].channelData!;
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

            postLoadPercent(++numCounted);
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

            postLoadPercent(++numCounted);
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

            postLoadPercent(++numCounted);
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

            postLoadPercent(++numCounted);
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

            postLoadPercent(++numCounted);
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

            postLoadPercent(++numCounted);
          });
        }
      }
    });
    //self.postMessage({ data: newMeasurements });

    return newMeasurements;
  },

  async prepare(
    kind: string,
    things: {
      id: string;
      kind: string;
      data: number[][][][];
      encodedMask?: number[];
      decodedMask?: DataArray;
    }[],
    onProgress: (value: number) => void
  ): Promise<{ kind: string; data: ThingData }> {
    console.log("prpare data worker");
    const thingInfo: ThingData = {};
    const thingCount = things.length;
    let i = 0;
    for await (const thingData of things) {
      const { id, data: rawData, encodedMask, decodedMask } = thingData;

      const data = tensor4d(rawData);
      const preparedThing = await prepareThingData({
        data,
        encodedMask,
        decodedMask,
      });
      thingInfo[id] = preparedThing;
      onProgress(Math.floor((i / thingCount) * 100));

      i++;
    }
    return { kind, data: thingInfo };
  },
};

(self as any).onconnect = function (event: MessageEvent) {
  const port = (event as MessageEvent).ports[0];
  Comlink.expose(measurementWorker, port);
};

//expose(measurementWorker);
