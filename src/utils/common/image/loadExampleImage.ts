import {
  fileFromPath,
  loadImageFileAsStack,
  convertToImage,
} from "./imageHelper";
import * as tf from "@tensorflow/tfjs";
import { ColorModel, Image as ImageJS } from "image-js";

import { deserializeAnnotations } from "utils/annotator";

import { Category, EncodedAnnotationType, SerializedFileType } from "types";

export const loadExampleImage = async (
  imagePath: string,
  serializedAnnotations: SerializedFileType,
  imageName?: string
) => {
  const imageFile = await fileFromPath(imagePath);
  const imageStack = await loadImageFileAsStack(imageFile);
  const image = await convertToImage(
    imageStack,
    imageName ? imageName : imageFile.name,
    undefined,
    1,
    3
  );

  const deserializedAnnotations = deserializeAnnotations(
    serializedAnnotations.annotations
  );

  const annotations: Array<EncodedAnnotationType> = [];

  const normImageData = image.data.mul(255);

  const imDataArray = (await normImageData.arraySync()) as number[][][];
  normImageData.dispose();
  const flatImageData = imDataArray.flat(3);
  const renderedIm = new ImageJS({
    width: image.shape.width,
    height: image.shape.height,
    data: flatImageData,
    colorModel: "RGB" as ColorModel,
    alpha: 0,
  });
  deserializedAnnotations.forEach((annotation) => {
    let bbox = annotation.boundingBox;

    const objectImage = renderedIm.crop({
      x: Math.abs(bbox[0]),
      y: Math.abs(bbox[1]),
      width: Math.abs(Math.min(512, bbox[2]) - bbox[0]),
      height: Math.abs(Math.min(512, bbox[3]) - bbox[1]),
    });
    const objSrc = objectImage.toDataURL();
    const data = tf.tensor4d(Float32Array.from(objectImage.data), [
      1,
      objectImage.height,
      objectImage.width,
      3,
    ]);
    annotations.push({
      ...annotation,
      data: data,
      src: objSrc,
      imageId: image.id,
      boundingBox: bbox,
    });
  });

  image.annotations.push(...annotations);

  const annotationCategories = serializedAnnotations.categories as Category[];

  return {
    image,
    annotationCategories,
    annotations,
  };
};
