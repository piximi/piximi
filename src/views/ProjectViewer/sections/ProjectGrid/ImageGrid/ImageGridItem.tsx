import { memo } from "react";

import { Box } from "@mui/material";

import { useRenderedSrc } from "hooks/useRenderedSrcs";

import { isUnknownCategory } from "store/data/utils";
import type { ExtendedImageObject } from "store/dataV2/types";

import { Partition } from "utils/modelsV2/enums";

import { getIconPosition, imageStyle } from "../gridItemUtils";
import { useGridItemStyle } from "../useGridItemStyle";
import { ItemOverlay } from "../ItemOverlay";

type ImageGridItemProps = {
  selected: boolean;
  handleClick: (id: string, selected: boolean) => void;
  item: ExtendedImageObject;
  isScrolling?: boolean;
};

export const ImageGridItem = memo(
  ({ selected, handleClick, item, isScrolling }: ImageGridItemProps) => {
    const { containerStyle, textOnScroll } = useGridItemStyle(selected);
    const { src } = useRenderedSrc(item.channelsRef);

    const handleSelect = (
      evt: React.MouseEvent<HTMLDivElement, MouseEvent>,
    ) => {
      evt.stopPropagation();
      handleClick(item.id, selected);
    };

    const imgElement = (
      <Box component="img" alt="" src={src} sx={imageStyle} draggable={false} />
    );

    if (isScrolling) {
      return (
        <Box sx={containerStyle}>
          {textOnScroll ? <ScrollingTextDetails image={item} /> : imgElement}
        </Box>
      );
    }

    return (
      <Box onClick={handleSelect} sx={containerStyle}>
        {imgElement}
        <ItemOverlay
          categoryColor={item.category.color}
          categoryName={item.category.name}
          usePredictedStyle={
            item.partition === Partition.Inference &&
            !isUnknownCategory(item.category.id)
          }
          position={getIconPosition(item.shape.height, item.shape.width)}
          itemId={item.id}
          itemType="image"
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
