import { memo } from "react";

import { Box, Typography } from "@mui/material";

import { Partition } from "core/dl/enums";
import { representsUnknown } from "core/entities";

import { useRenderedSrc } from "hooks";

import { altTextStyle, getIconPosition, imageStyle } from "../gridItemUtils";
import { GridPlaceholder } from "../GridPlaceholder";
import { useGridItemStyle } from "../useGridItemStyle";
import { useImageGridItem } from "../useGridItems";
import { ItemOverlay } from "../ItemOverlay";

import type { ImageRecord } from "core/backend";
import type { ExtendedImageObject } from "core/entities";

type ImageGridItemProps = {
  selected: boolean;
  handleClick: (id: string, selected: boolean) => void;
  item: ImageRecord;
  isScrolling?: boolean;
};

export const ImageGridItem = memo(
  ({ selected, handleClick, item, isScrolling }: ImageGridItemProps) => {
    const image = useImageGridItem(item);
    if (!image) return <GridPlaceholder />;
    return (
      <ImageCell
        image={image}
        record={item}
        selected={selected}
        handleClick={handleClick}
        isScrolling={isScrolling}
      />
    );
  },
);

const ImageCell = ({
  image,
  record,
  selected,
  handleClick,
  isScrolling,
}: Omit<ImageGridItemProps, "item"> & {
  image: ExtendedImageObject;
  record: ImageRecord;
}) => {
  const { containerStyle, textOnScroll } = useGridItemStyle(selected);
  const { src } = useRenderedSrc(image.channelsRef);

  const handleSelect = (evt: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    evt.stopPropagation();
    handleClick(image.id, selected);
  };

  const imgElement = src ? (
    <Box
      component="img"
      alt={image.name}
      src={src}
      sx={imageStyle}
      draggable={false}
    />
  ) : (
    <Box
      sx={(theme) => ({
        ...imageStyle,
        border: `1px dashed ${theme.palette.text.primary}`,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      })}
    >
      <Typography align="center" variant="body2" sx={altTextStyle}>
        {image.name}
      </Typography>
    </Box>
  );

  return isScrolling && textOnScroll ? (
    <ScrollingTextDetails image={image} />
  ) : (
    <Box onClick={handleSelect} sx={containerStyle}>
      {imgElement}
      {src !== "" && (
        <ItemOverlay
          categoryColor={image.category.color}
          categoryName={image.category.name}
          usePredictedStyle={
            image.partition === Partition.Inference &&
            !representsUnknown(image.category.id)
              ? image.predictionConfidence
              : undefined
          }
          position={getIconPosition(image.shape.height, image.shape.width)}
          itemId={image.id}
          itemType="image"
          item={record}
        />
      )}
    </Box>
  );
};

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
