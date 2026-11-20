import type {
  AnnotationVolume,
  ImageObject,
  PredictionCorrection,
} from "core/entities";

import type { ImageUpdate, VolumeUpdate } from "../types";

type Predicted = {
  predictionConfidence?: number;
  predictedAtRunId?: string;
  predictionCorrected?: PredictionCorrection;
};

const predicted = (source: Predicted): Predicted => ({
  ...(source.predictionConfidence !== undefined && {
    predictionConfidence: source.predictionConfidence,
  }),
  ...(source.predictedAtRunId !== undefined && {
    predictedAtRunId: source.predictedAtRunId,
  }),
  ...(source.predictionCorrected !== undefined && {
    predictionCorrected: source.predictionCorrected,
  }),
});

/* The fields a category change rewrites, as the store holds them now. */
export const imageUpdate = (image: ImageObject): ImageUpdate => ({
  id: image.id,
  categoryId: image.categoryId,
  partition: image.partition,
  ...predicted(image),
});

export const volumeUpdate = (volume: AnnotationVolume): VolumeUpdate => ({
  id: volume.id,
  kindId: volume.kindId,
  categoryId: volume.categoryId,
  ...predicted(volume),
});
