import { v4 as uuid } from "uuid";
import { generateDefaultColors } from "./imageHelper";
import * as tf from "@tensorflow/tfjs";
import { ColorModel, Image as ImageJS } from "image-js";

import { ImageType, UNKNOWN_IMAGE_CATEGORY, Partition } from "types";

import { imjoyRPC } from "imjoy-rpc";

const loadImage = async (image: any, cb: any) => {
  console.log("image looks like", image);

  const [height, width, channels] = image._rshape;

  const imageBuffer = new Float32Array(image._rvalue, image._rvalue.byteOffset);

  console.log("trying my best", height, width, channels, imageBuffer);

  const imTensor = tf.tensor4d(imageBuffer, [1, height, width, channels]);
  console.log("imtensor shape", imTensor.shape);

  const imgObj = new ImageJS({
    width,
    height,
    colorModel: "RGB" as ColorModel,
    alpha: 0,
  });
  const src = imgObj.toDataURL();

  console.log("src from imagejs", src);

  const colors = await generateDefaultColors(imTensor);

  const decodedImage: ImageType = {
    id: uuid(),
    activePlane: 0,
    bitDepth: 8,
    categoryId: UNKNOWN_IMAGE_CATEGORY.id,
    name: "imjoy_uploaded_image",
    shape: { planes: 1, height, width, channels },
    data: imTensor,
    partition: Partition.Inference,
    visible: true,
    src,
    colors,
  };

  console.log("i have decoded the image, dispatching (hopefully)");

  cb(decodedImage);
};

export const loadImjoyImage = async (cb: (image: ImageType) => any) => {
  const setupPromise = imjoyRPC.setupRPC({
    name: "Piximi",
    version: "0.1.0",
    description: "Browser based annotation and deep learning",
    type: "rpc-window",
    docs: "documentation.piximi.app",
    authors: ["Nodar Gogoberidze", "Wei Ouyang"],
    license: "3-Clause BSD License",
    labels: ["visualization", "deep learning", "image analysis"],
  });
  setupPromise
    .then((api: any) => {
      api.export({ loadImage: (im: any) => loadImage(im, cb) });
    })
    .catch((err: any) => console.log("oh no", err));

  console.log("sent off setup, awaiting...");
  await setupPromise;
  console.log("ended");
};
