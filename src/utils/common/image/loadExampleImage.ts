import { ColorModel, Image as ImageJS } from "image-js";

import { deserializeAnnotations_v1 } from "utils/file-io/deserialize/v1/deserializePiximiAnnotations_v1";

import { AnnotationType, Category, SerializedFileType } from "types";

import {
  fileFromPath,
  loadImageFileAsStack,
  convertToImage,
  getPropertiesFromImageSync,
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

  const deserializedAnnotations = deserializeAnnotations_v1(
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

  for (const annotation of deserializedAnnotations) {
    const annImProps = await getPropertiesFromImageSync(
      renderedIm,
      image,
      annotation
    );

    annotations.push({
      ...annotation,
      ...annImProps,
    } as AnnotationType);
  }

  const annotationCategories = serializedAnnotations.categories as Category[];

  return {
    image,
    annotationCategories,
    annotations,
  };
};
