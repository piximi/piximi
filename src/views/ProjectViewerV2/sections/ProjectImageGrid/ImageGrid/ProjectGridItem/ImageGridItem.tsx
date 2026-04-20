import { memo } from "react";
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

import { ImageObject } from "store/dataV2/types";
import { useParameterizedSelector } from "store/hooks";
import {
  selectActiveExtendedChannels,
  selectCategoryById,
} from "store/dataV2/selectors";
import { useRenderedSrc } from "hooks/useRenderedSrcs";

type ImageGridItemProps = {
  selected: boolean;
  handleClick: (id: string, selected: boolean) => void;
  image: ImageObject;
  isScrolling?: boolean;
  scale: number;
};

const getIconPosition = (
  scale: number,
  height: number | undefined,
  width: number | undefined,
) => {
  if (!height || !width) return { top: 0, left: 0 };
  const containerSize = 220 * scale;
  const scaleBy = width > height ? width : height;
  const dimScaleFactor = containerSize / scaleBy;
  const scaledWidth = dimScaleFactor * width;
  const scaledHeight = dimScaleFactor * height;

  const offsetY = Math.ceil((containerSize - scaledHeight) / 2);
  const offsetX = Math.ceil((containerSize - scaledWidth) / 2);

  return { top: offsetY, left: offsetX };
};

const printSize = (scale: number) => {
  return (220 * scale).toString() + "px";
};

export const ImageGridItem = memo(
  ({
    selected,
    handleClick,
    image,
    isScrolling,
    scale,
  }: ImageGridItemProps) => {
    const channels = useParameterizedSelector(
      selectActiveExtendedChannels,
      image.id,
    );
    const category = useParameterizedSelector(
      selectCategoryById,
      image.categoryId,
    );
    const imageSelectionColor = useSelector(selectImageSelectionColor);
    const selectedImageBorderWidth = useSelector(
      selectSelectedImageBorderWidth,
    );
    const textOnScroll = useSelector(selectTextOnScroll);

    const { src, loading } = useRenderedSrc(channels);

    const handleSelect = (
      evt: React.MouseEvent<HTMLDivElement, MouseEvent>,
    ) => {
      evt.stopPropagation();
      handleClick(image.id, selected);
    };

    return isScrolling ? (
      <Box
        sx={{
          position: "relative",
          boxSizing: "content-box",
          border: `solid ${selectedImageBorderWidth}px ${
            selected ? imageSelectionColor : "transparent"
          }`,
          margin: `${10 - selectedImageBorderWidth}px`,
          borderRadius: selectedImageBorderWidth + "px",
          width: printSize(scale),
          height: printSize(scale),
        }}
      >
        {textOnScroll ? (
          <>
            Name: {image.name}
            <br />
            <span style={{ color: category.color }}>
              Category: {category.name}
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
        ) : (
          <Box
            component="img"
            alt=""
            src={src}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              top: 0,
              transform: "none",
            }}
            draggable={false}
          />
        )}
      </Box>
    ) : (
      <Box
        position="relative" // must be a position element for absolutely positioned ImageIconLabel
        onClick={handleSelect}
        sx={{
          boxSizing: "content-box",
          border: `solid ${selectedImageBorderWidth}px ${
            selected ? imageSelectionColor : "transparent"
          }`,
          borderRadius: selectedImageBorderWidth + "px",
          margin: `${10 - selectedImageBorderWidth}px`,
          width: printSize(scale),
          height: printSize(scale),
        }}
      >
        <Box
          component="img"
          alt=""
          src={src}
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            top: 0,
            transform: "none",
          }}
          draggable={false}
        />
        <ImageDetailContainer
          backgroundColor={category.color}
          categoryName={category.name}
          usePredictedStyle={
            image.partition === Partition.Inference &&
            !isUnknownCategory(image.categoryId)
          }
          image={image}
          position={getIconPosition(
            scale,
            image.shape.height,
            image.shape.width,
          )}
        />
      </Box>
    );
  },
);
