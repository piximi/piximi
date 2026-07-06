import { memo } from "react";

import { Box, Typography } from "@mui/material";

import { useRenderedSrc } from "hooks/useRenderedSrcs";

import { isUnknownCategory } from "store/data/utils";
import type { ExtendedImageObject } from "store/dataV2/types";

import { Partition } from "utils/dl/enums";

import { altTextStyle, getIconPosition, imageStyle } from "../gridItemUtils";
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

    const imgElement = src ? (
      <Box
        component="img"
        alt={item.name}
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
          {item.name}
        </Typography>
      </Box>
    );

    // if (isScrolling) {
    //   return (
    //     <Box sx={containerStyle}>
    //       {textOnScroll ? <ScrollingTextDetails image={item} /> : imgElement}
    //     </Box>
    //   );
    // }

    return isScrolling && textOnScroll ? (
      <ScrollingTextDetails image={item} />
    ) : (
      <Box onClick={handleSelect} sx={containerStyle}>
        {imgElement}
        {src !== "" && (
          <ItemOverlay
            categoryColor={item.category.color}
            categoryName={item.category.name}
            usePredictedStyle={
              item.partition === Partition.Inference &&
              !isUnknownCategory(item.category.id)
                ? item.predictionConfidence
                : undefined
            }
            position={getIconPosition(item.shape.height, item.shape.width)}
            itemId={item.id}
            itemType="image"
          />
        )}
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
