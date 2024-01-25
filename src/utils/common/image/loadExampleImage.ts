import * as tf from "@tensorflow/tfjs";
import { ColorModel, Image as ImageJS } from "image-js";

import { deserializeAnnotations } from "utils/annotator";

import { Category, AnnotationType, SerializedFileType } from "types";

import {
  fileFromPath,
  loadImageFileAsStack,
  convertToImage,
} from "./imageHelper";

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
    serializedAnnotations.annotations,
    image.id
  );
  const annotations: Array<AnnotationType> = [];

  const normImageData = image.data.mul(255);
  const imDataArray = normImageData.arraySync() as number[][][];
  normImageData.dispose();
  const flatImageData = imDataArray.flat(3);
  const renderedIm = new ImageJS({
    width: image.shape.width,
    height: image.shape.height,
    data: flatImageData,
    colorModel: "RGB" as ColorModel,
    alpha: 0,
  });

  //TODO: Remove Later
  const catDict = serializedAnnotations.categories.reduce(
    (map: Record<string, string>, cat: Category) => {
      return { ...map, [cat.id]: cat.name };
    },
    {}
  );
  deserializedAnnotations.forEach((annotation) => {
    let bbox = annotation.boundingBox;

    const objectImage = renderedIm.crop({
      x: Math.abs(bbox[0]),
      y: Math.abs(bbox[1]),
      width: Math.abs(Math.min(image.shape.width, bbox[2]) - bbox[0]),
      height: Math.abs(Math.min(image.shape.height, bbox[3]) - bbox[1]),
    });
    const objSrc = objectImage.toDataURL();
    const data = tf.tensor4d(Float32Array.from(objectImage.data), [
      1,
      objectImage.height,
      objectImage.width,
      3,
    ]);
    //TODO: Remove Later
    const category = catDict[annotation.categoryId];
    annotations.push({
      ...annotation,

      data: data,
      src: objSrc,
      imageId: image.id,
      boundingBox: bbox,
      kind: category,
    });
  });

  const annotationCategories = serializedAnnotations.categories as Category[];

  return {
    image,
    annotationCategories,
    annotations,
  };
};
