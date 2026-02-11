// src/workers/scheduler/worker.ts
import { tensor1d, tensor4d } from "@tensorflow/tfjs";
import * as Comlink from "comlink";

import {
  getEQPC,
  getIntensityMeasurement,
  getObjectFormFactor,
  getPerimeterFromMask,
} from "utils/measurements/utils";
import { prepareEntityChannelData } from "views/MeasurementView/utils";
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
} from "views/MeasurementView/types";
import { PreparedEntityChannels } from "views/MeasurementView/types";
import { decode } from "views/ImageViewer/utils";
import {
  AnalyzeTiffInput,
  AnalyzeTiffOutput,
  CancelToken,
  ExtendedWorkerAPI,
} from "./types";
import {
  IMAGE_MEASUREMENT_KEYS,
  OBJECT_MEASUREMENT_KEYS,
} from "store/data/consts";
import { logger } from "utils/logUtils";
import {
  loadImageFromBuffer,
  prepareChannels,
  renderPreview,
  stackToTensor,
  tensorToBuffer,
} from "./imageProcessing";
import { generateDefaultColors } from "utils/tensorUtils";
import { generateUUID } from "store/data/utils";

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

const workerAPI: ExtendedWorkerAPI = {
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
      logger(image.id);
      measurementsToRun.forEach((measurement) => logger(measurement));
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
          if (value !== undefined)
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
  async loadImage(input, cancelToken, onProgress) {
    onProgress(0);

    if (cancelToken.cancelled) {
      throw new DOMException("Task cancelled", "AbortError");
    }

    // Load image from buffer
    onProgress(30);
    const stack = await loadImageFromBuffer(input.fileData);

    if (cancelToken.cancelled) {
      throw new DOMException("Task cancelled", "AbortError");
    }

    // Convert to tensor
    onProgress(50);
    const { tensor, shape } = stackToTensor(stack);

    // Generate colors
    onProgress(70);
    const bitDepth = stack[0].bitDepth;
    const colors = await generateDefaultColors(tensor);

    // Extract buffer
    onProgress(80);
    const { buffer, dtype } = tensorToBuffer(tensor);

    // Render preview
    onProgress(90);
    const renderedSrc = await renderPreview(tensor, colors);

    tensor.dispose();

    onProgress(100);

    return {
      id: generateUUID(),
      buffer,
      dtype,
      shape,
      bitDepth,
      colors,
      renderedSrc,
    };
  },

  /**
   * Load and prepare an image in one operation
   * This is the most common path - load, convert, prepare, all in worker
   */
  async loadAndPrepare(input, cancelToken, onProgress) {
    onProgress(0);

    if (cancelToken.cancelled) {
      throw new DOMException("Task cancelled", "AbortError");
    }

    // Load image
    onProgress(10);
    const stack = await loadImageFromBuffer(input.fileData);

    if (cancelToken.cancelled) {
      throw new DOMException("Task cancelled", "AbortError");
    }

    // Convert to tensor
    onProgress(30);
    const { tensor, shape } = stackToTensor(stack);

    // Generate colors
    onProgress(40);
    const bitDepth = stack[0].bitDepth;
    const colors = await generateDefaultColors(tensor);

    // Prepare channels (this is the expensive operation)
    onProgress(50);
    const preparedChannels = prepareChannels(tensor);

    if (cancelToken.cancelled) {
      tensor.dispose();
      throw new DOMException("Task cancelled", "AbortError");
    }

    // Extract buffer
    onProgress(80);
    const { buffer, dtype } = tensorToBuffer(tensor);

    // Render preview
    onProgress(90);
    const renderedSrc = await renderPreview(tensor, colors);

    // Cleanup
    tensor.dispose();

    onProgress(100);

    return {
      id: input.imageId,
      buffer,
      dtype,
      shape,
      preparedChannels,
      renderedSrc,
      bitDepth,
      colors,
    };
  },

  /**
   * Analyze a TIFF file without fully loading it
   * Used to detect multi-frame TIFFs and suggest interpretation
   */
  async analyzeTiff(
    input: AnalyzeTiffInput,
    cancelToken: CancelToken,
  ): Promise<AnalyzeTiffOutput> {
    if (cancelToken.cancelled) {
      throw new DOMException("Task cancelled", "AbortError");
    }

    // TODO (Phase 2): Implement TIFF header parsing
    // For now, return placeholder

    return {
      frameCount: 1,
      isMultiFrame: false,
      suggestedType: "unknown",
      confidence: 0,
      metadata: {},
    };
  },
};

Comlink.expose(workerAPI);
