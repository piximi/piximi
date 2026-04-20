import { CSSProperties, memo } from "react";
import { useSelector } from "react-redux";

import { Box } from "@mui/material";

import { ImageDetailContainer } from "./ImageDetailContainer";

import {
  selectImageSelectionColor,
  selectSelectedImageBorderWidth,
  selectTextOnScroll,
} from "store/applicationSettings/selectors";

import { isUnknownCategory } from "store/data/utils";

import { Partition } from "utils/models/enums";

import { ExtendedImageObject } from "store/dataV2/types";

import { useRenderedSrc } from "hooks/useRenderedSrcs";

type ImageGridItemProps = {
  selected: boolean;
  handleClick: (id: string, selected: boolean) => void;
  image: ExtendedImageObject;
  isScrolling?: boolean;
};

const getIconPosition = (
  height: number | undefined,
  width: number | undefined,
) => {
  if (!height || !width) return { top: "0%", left: "0%" };
  const scaleBy = Math.max(width, height);
  const offsetY = ((1 - height / scaleBy) / 2) * 100;
  const offsetX = ((1 - width / scaleBy) / 2) * 100;
  return { top: offsetY + "%", left: offsetX + "%" };
};

const imageStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "contain",
  top: 0,
  transform: "none",
};

export const ImageGridItem = memo(
  ({ selected, handleClick, image, isScrolling }: ImageGridItemProps) => {
    const imageSelectionColor = useSelector(selectImageSelectionColor);
    const selectedImageBorderWidth = useSelector(
      selectSelectedImageBorderWidth,
    );
    const textOnScroll = useSelector(selectTextOnScroll);

    const { src } = useRenderedSrc(image.channels);

    const handleSelect = (
      evt: React.MouseEvent<HTMLDivElement, MouseEvent>,
    ) => {
      evt.stopPropagation();
      handleClick(image.id, selected);
    };

    const containerStyle: CSSProperties = {
      position: "relative",
      boxSizing: "content-box",
      border: `solid ${selectedImageBorderWidth}px ${
        selected ? imageSelectionColor : "transparent"
      }`,
      margin: `${10 - selectedImageBorderWidth}px`,
      borderRadius: selectedImageBorderWidth + "px",
      width: "var(--item-size)",
      height: "var(--item-size)",
    };

    const imgElement = (
      <Box component="img" alt="" src={src} sx={imageStyle} draggable={false} />
    );

    if (isScrolling) {
      return (
        <Box sx={containerStyle}>
          {textOnScroll ? <ScrollingTextDetails image={image} /> : imgElement}
        </Box>
      );
    }

    return (
      <Box onClick={handleSelect} sx={containerStyle}>
        {imgElement}
        <ImageDetailContainer
          backgroundColor={image.category.color}
          categoryName={image.category.name}
          usePredictedStyle={
            image.partition === Partition.Inference &&
            !isUnknownCategory(image.category.id)
          }
          image={image}
          position={getIconPosition(image.shape.height, image.shape.width)}
        />
      </Box>
    );
  },
);

const ScrollingTextDetails = ({ image }: { image: ExtendedImageObject }) => (
  <>
    Name: {image.name}
    <br />
    <span style={{ color: image.category.color }}>
      Category: {image.category.name}
    </span>
    <br />
    Width: {image.shape.width}
    <br />
    Height: {image.shape.height}
    <br />
    Channels: {image.shape.channels}
    <br />
    Planes: {image.shape.planes}
    <br />
    Partition: {image.partition}
  </>
);
