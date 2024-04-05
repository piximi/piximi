import React from "react";
import { batch, useDispatch } from "react-redux";

import { SerializedFileType } from "types";

import { BaseHorizCard } from "../BaseHorizCard";
import { loadExampleImage } from "utils/common/image";
import { dataConverter_v1v2 } from "utils/converters/dataConverter_v1v2";
import { newDataSlice } from "store/slices/newData/newDataSlice";

type ExampleImageType = {
  name: string;
  description: string;
  imageData: string;
  annotationsFile: SerializedFileType;
  source: {
    sourceName: string;
    sourceUrl: string;
  };
  license?: {
    licenseName: string;
    licenseUrl: string;
  };
};

type ExampleImageCardProps = {
  exampleImage: ExampleImageType;
  onClose: () => void;
};

export const ExampleImageCardNew = ({
  exampleImage,
  onClose,
}: ExampleImageCardProps) => {
  const dispatch = useDispatch();

  const openExampleImage = async () => {
    onClose();

    const { image, annotations, annotationCategories } = await loadExampleImage(
      exampleImage.imageData,
      exampleImage.annotationsFile as SerializedFileType,
      exampleImage.name
    );

    const data = dataConverter_v1v2({
      images: [image],
      oldCategories: [],
      annotations,
      annotationCategories,
    });

    batch(() => {
      dispatch(
        newDataSlice.actions.initializeState({
          data,
        })
      );
    });
  };
  return (
    <BaseHorizCard
      title={exampleImage.name}
      image={exampleImage.imageData}
      action={openExampleImage}
      description={exampleImage.description}
      source={exampleImage.source}
      license={exampleImage.license}
    />
  );
};
