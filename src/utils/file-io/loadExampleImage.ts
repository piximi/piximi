import { ColorModel, Image as ImageJS } from "image-js";

import { deserializeAnnotations_v1 } from "utils/file-io/deserialize/v1/deserializePiximiAnnotations_v1";

import { SerializedFileType } from "utils/file-io/types";
import { fileFromPath, loadImageFileAsStack } from "./helpers";
import { convertToImage } from "utils/common/tensorHelpers";
import { getPropertiesFromImageSync } from "utils/common/helpers";
import { Category, OldAnnotationType } from "store/data/types";

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
  const annotations: Array<OldAnnotationType> = [];

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
    const annImProps = getPropertiesFromImageSync(
      renderedIm,
      image,
      annotation
    );

    annotations.push({
      ...annotation,
      ...annImProps,
    } as OldAnnotationType);
  }

  const annotationCategories = serializedAnnotations.categories as Category[];

  return {
    image,
    annotationCategories,
    annotations,
  };
};
