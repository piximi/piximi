import * as tensorflow from "@tensorflow/tfjs";

export const resize = async (item: {
  xs: any;
  ys: tensorflow.Tensor;
}): Promise<{ xs: tensorflow.Tensor; ys: tensorflow.Tensor }> => {
  const resized = tensorflow.image.resizeBilinear(item.xs, [224, 224]);

  return new Promise((resolve) => {
    return resolve({ ...item, xs: resized });
  });
};
