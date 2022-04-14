import * as tf from "@tensorflow/tfjs";

export const padToMatch = (
  sample: tf.Tensor<tf.Rank.R3>,
  targetWidth: number,
  targetHeight: number
): tf.Tensor<tf.Rank.R3> => {
  const sampleHeight = sample.shape[0];
  const sampleWidth = sample.shape[1];

  const dHeight = targetHeight - sampleHeight;
  const dWidth = targetWidth - sampleWidth;

  let padY: [number, number] = [0, 0];
  if (dHeight > 0) {
    padY[0] = Math.floor(dHeight / 2);
    padY[1] = Math.ceil(dHeight / 2);
  }

  let padX: [number, number] = [0, 0];
  if (dWidth > 0) {
    padX[0] = Math.floor(dWidth / 2);
    padX[1] = Math.ceil(dWidth / 2);
  }

  const padded: tf.Tensor<tf.Rank.R3> = sample.pad([padY, padX, [0, 0]]);

  sample.dispose();
  return padded;
};
