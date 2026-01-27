// src/workers/scheduler/worker.ts
import { tensor1d, tensor4d } from "@tensorflow/tfjs";
import * as Comlink from "comlink";

import {
  getEQPC,
  getIntensityMeasurement,
  getObjectFormFactor,
  getPerimeterFromMask,
} from "utils/measurements/utils";
import { prepareEntityChannelData } from "views/MeasurementView2/utils";
import {
  ChannelData,
  ChannelMeasurements,
  ComputedImageMeasurements,
  ImageObject,
  ObjectMeasurements,
} from "store/data/types";
import { calculateCenterOfMass } from "features/annotation-tracking/utils";
import {
  PreparedAnnotationData,
  PreparedEntityData,
} from "views/MeasurementView2/types";
import { PreparedEntityChannels } from "views/MeasurementView2/types";
import { decode } from "views/ImageViewer/utils";
import { CancelToken } from "./types";
import {
  IMAGE_MEASUREMENT_KEYS,
  OBJECT_MEASUREMENT_KEYS,
} from "store/data/consts";

const getEncodedMaskArea = (encodedMask: number[]) => {
  return encodedMask.reduce((count: number, value, idx) => {
    if (idx % 2 === 1) count += value;
    return count;
  }, 0);
};

export interface WorkerAPI {
  annotationMeasurements: (
    annotations: Record<string, PreparedAnnotationData>,
    selectedMeasurements: (keyof ObjectMeasurements)[],
    cancelToken: CancelToken,
    onProgress: (progress: number) => void,
  ) => Promise<{ annId: string; measurements: ObjectMeasurements }[]>;
  imageMeasurements: (
    images: ImageObject[],
    selectedMeasurements: (keyof ComputedImageMeasurements)[],
    cancelToken: CancelToken,
    onProgress: (progress: number) => void,
  ) => Promise<{ annId: string; measurements: ObjectMeasurements }[]>;

  channelMeasurements: (
    entities: { id: string; measurements: { channels: ChannelData[] } }[],
    measurements: Partial<Record<keyof ChannelMeasurements, number[]>>,
    cancelToken: CancelToken,
    onProgress: (progress: number) => void,
  ) => Promise<Record<string, Record<number, ChannelData>>>;

  prepare: (
    kind: string,
    entities: PreparedEntityData[],
    cancelToken: CancelToken,
    onProgress: (value: number) => void,
  ) => Promise<{ kind: string; data: PreparedEntityChannels }>;
}

const workerAPI: WorkerAPI = {
  async annotationMeasurements(
    annotations,
    selectedMeasurements,
    cancelToken,
    onProgress,
  ) {
    let progress = 0;
    const annotationValues = Object.values(annotations);
    const annotationCount = annotationValues.length;

    const postLoadPercent = (num: number) => {
      const currentProgress = Math.floor((num / annotationCount) * 100);
      if (currentProgress > progress) {
        progress = currentProgress;
        onProgress(currentProgress);
      }
    };

    const measurementsToRun =
      selectedMeasurements.length > 0
        ? selectedMeasurements
        : OBJECT_MEASUREMENT_KEYS;

    const newMeasurements: {
      annId: string;
      measurements: ObjectMeasurements;
    }[] = [];

    let numCounted = 0;
    for (const annotation of annotationValues) {
      if (cancelToken.cancelled) {
        throw new DOMException("Task cancelled", "AbortError");
      }

      const existingMeasurements = annotation.measurements;
      const maskShape = {
        width: annotation.boundingBox[2] - annotation.boundingBox[0],
        height: annotation.boundingBox[3] - annotation.boundingBox[1],
      };
      const decodedMask =
        annotation.decodedMask ??
        new Uint8Array(decode(annotation.encodedMask));

      const newAnnMeasurements: {
        annId: string;
        measurements: ObjectMeasurements;
      } = { annId: annotation.id, measurements: { channels: [] } };

      const toMeasure = measurementsToRun.filter(
        (measurement) =>
          !existingMeasurements || !existingMeasurements[measurement],
      );

      for (const measurement of toMeasure) {
        switch (measurement) {
          case "area": {
            newAnnMeasurements.measurements.area = getEncodedMaskArea(
              annotation.encodedMask!,
            );
            break;
          }
          case "perimeter": {
            newAnnMeasurements.measurements.perimeter = getPerimeterFromMask(
              decodedMask,
              maskShape,
            );
            break;
          }
          case "bboxArea": {
            newAnnMeasurements.measurements.bboxArea =
              maskShape.width * maskShape.height;
            break;
          }
          case "extent": {
            const area =
              annotation.measurements?.area ??
              newAnnMeasurements.measurements.area ??
              getEncodedMaskArea(annotation.encodedMask!);
            const bbArea =
              annotation.measurements?.bboxArea ??
              newAnnMeasurements.measurements.bboxArea ??
              maskShape.width * maskShape.height;
            newAnnMeasurements.measurements.extent = area / bbArea;
            break;
          }
          case "eqpc": {
            const area =
              annotation.measurements?.area ??
              newAnnMeasurements.measurements.area ??
              getEncodedMaskArea(annotation.encodedMask!);
            newAnnMeasurements.measurements.eqpc = getEQPC(area);
            break;
          }
          case "ped": {
            const per =
              annotation.measurements?.perimeter ??
              newAnnMeasurements.measurements.perimeter ??
              getPerimeterFromMask(decodedMask, maskShape);
            newAnnMeasurements.measurements.ped = per / Math.PI;
            break;
          }
          case "sphericity": {
            const area =
              annotation.measurements?.area ??
              newAnnMeasurements.measurements.area ??
              getEncodedMaskArea(annotation.encodedMask!);
            newAnnMeasurements.measurements.sphericity = getObjectFormFactor(
              area,
              decodedMask,
              maskShape,
            );
            break;
          }
          case "compactness": {
            const area =
              annotation.measurements?.area ??
              newAnnMeasurements.measurements.area ??
              getEncodedMaskArea(annotation.encodedMask!);
            const sphericity =
              annotation.measurements?.sphericity ??
              newAnnMeasurements.measurements.sphericity ??
              getObjectFormFactor(area, decodedMask, maskShape);
            newAnnMeasurements.measurements.compactness = 1 / sphericity;
            break;
          }
          case "com": {
            const com = calculateCenterOfMass(decodedMask, maskShape.width);
            com.x = com.x + annotation.boundingBox[0];
            com.y = com.y + annotation.boundingBox[1];
            newAnnMeasurements.measurements.com = com;
            break;
          }
        }
      }

      postLoadPercent(++numCounted);
      newMeasurements.push(newAnnMeasurements);
    }

    return newMeasurements;
  },
  async imageMeasurements(
    images,
    selectedMeasurements,
    cancelToken,
    onProgress,
  ) {
    let progress = 0;
    const imageCount = images.length;

    const postLoadPercent = (num: number) => {
      const currentProgress = Math.floor((num / imageCount) * 100);
      if (currentProgress > progress) {
        progress = currentProgress;
        onProgress(currentProgress);
      }
    };

    const measurementsToRun =
      selectedMeasurements.length > 0
        ? selectedMeasurements
        : IMAGE_MEASUREMENT_KEYS;

    const newMeasurements: {
      annId: string;
      measurements: ObjectMeasurements;
    }[] = [];

    let numCounted = 0;
    for (const image of images) {
      if (cancelToken.cancelled) {
        throw new DOMException("Task cancelled", "AbortError");
      }
      //TODO Actually implement measurements
      console.log(image.id);
      measurementsToRun.forEach((measurement) => console.log(measurement));
      postLoadPercent(++numCounted);
    }

    return newMeasurements;
  },

  async channelMeasurements(entities, measurements, cancelToken, onProgress) {
    const entityMeasurements: Record<string, Record<number, ChannelData>> = {};
    const numEntities = entities.length;

    let progress = 0;
    let completed = 0;
    const postLoadPercent = (num: number) => {
      const currentProgress = Math.floor((num / numEntities) * 100);
      if (currentProgress > progress) {
        progress = currentProgress;
        onProgress(currentProgress);
      }
    };
    entities.forEach((entity) => {
      if (cancelToken.cancelled) {
        throw new DOMException("Task cancelled", "AbortError");
      }
      const existingMeasurementData = entity.measurements.channels;
      const entityChannelDataTensors = existingMeasurementData.map((data) =>
        tensor1d(data.channelData!),
      );

      Object.entries(measurements).forEach(([measurement, channels]) => {
        if (cancelToken.cancelled) {
          throw new DOMException("Task cancelled", "AbortError");
        }
        channels.forEach((channel) => {
          if (cancelToken.cancelled) {
            throw new DOMException("Task cancelled", "AbortError");
          }
          const entityChannelData = existingMeasurementData.find(
            (data) => +data.channelId === channel,
          );
          if (!entityChannelData) throw new Error("No channel data found");
          if (entityChannelData[measurement as keyof ChannelMeasurements])
            return;

          const value = getIntensityMeasurement(
            entityChannelDataTensors[channel],
            measurement as keyof ChannelMeasurements,
          );
          if (value)
            if (entityMeasurements[entity.id]) {
              if (entityMeasurements[entity.id][channel])
                entityMeasurements[entity.id][channel][
                  measurement as keyof ChannelMeasurements
                ] = value;
              else
                entityMeasurements[entity.id][channel] = {
                  channelId: channel + "",
                  [measurement as keyof ChannelMeasurements]: value,
                };
            } else
              entityMeasurements[entity.id] = {
                [channel]: {
                  channelId: channel + "",
                  [measurement as keyof ChannelMeasurements]: value,
                },
              };
        });
      });
      completed++;
      postLoadPercent(completed);
      entityChannelDataTensors.forEach((tensor) => tensor.dispose());
    });

    return entityMeasurements;
  },

  async prepare(kind, entities, cancelToken, onProgress) {
    const entityChannelData: PreparedEntityChannels = {};
    const entityCount = entities.length;
    let i = 0;

    for (const entityData of entities) {
      if (cancelToken.cancelled) {
        throw new DOMException("Task cancelled", "AbortError");
      }

      const { id, data: rawData, encodedMask, decodedMask } = entityData;
      const data = tensor4d(rawData);
      const preparedChannels = await prepareEntityChannelData(
        data,
        encodedMask,
        decodedMask,
      );
      data.dispose();
      entityChannelData[id] = preparedChannels;
      onProgress(Math.floor((i / entityCount) * 100));
      i++;
    }

    return { kind, data: entityChannelData };
  },
};

Comlink.expose(workerAPI);
