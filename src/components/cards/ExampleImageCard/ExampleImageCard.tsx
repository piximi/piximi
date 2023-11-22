import React from "react";
import { batch, useDispatch } from "react-redux";

import { dataSlice } from "store/slices/data";
import { SerializedFileType } from "types";

import { BaseHorizCard } from "../BaseHorizCard";
import { loadExampleImage } from "utils/common/image";

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

export const ExampleImageCard = ({
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

    batch(() => {
      dispatch(
        dataSlice.actions.initData({
          images: [image],
          annotations: annotations,
          annotationCategories: annotationCategories,
          categories: [],
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
