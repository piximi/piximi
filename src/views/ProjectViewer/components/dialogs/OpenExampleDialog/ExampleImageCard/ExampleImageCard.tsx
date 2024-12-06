import React from "react";
import { batch, useDispatch } from "react-redux";

import { BaseHorizCard } from "components/ui/BaseHorizCard";

import { dataSlice } from "store/data";
import { projectSlice } from "store/project";

import { dataConverter_v01v02 } from "utils/file-io/converters/dataConverter_v01v02";
import { loadExampleImage } from "utils/file-io/loadExampleImage";

import { SerializedFileType } from "utils/file-io/types";

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

    const data = dataConverter_v01v02({
      images: [image],
      oldCategories: [],
      annotations,
      annotationCategories,
    });

    batch(() => {
      dispatch(projectSlice.actions.setProjectImageChannels({ channels: 3 }));
      dispatch(
        dataSlice.actions.initializeState({
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
