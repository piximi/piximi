import { memo } from "react";

import { Box, Typography } from "@mui/material";

import { Partition } from "core/dl/enums";
import { representsUnknown } from "core/entities";

import { useRenderedSrc } from "hooks";

import { altTextStyle, getIconPosition, imageStyle } from "../gridItemUtils";
import { GridPlaceholder } from "../GridPlaceholder";
import { useGridItemStyle } from "../useGridItemStyle";
import { useAnnotationGridItem } from "../useGridItems";
import { ItemOverlay } from "../ItemOverlay";

import type { AnnotationRecord } from "core/backend";
import type { ExtendedAnnotationObject } from "core/entities";

type AnnotationGridItemProps = {
  selected: boolean;
  handleClick: (id: string, selected: boolean) => void;
  item: AnnotationRecord;
  isScrolling?: boolean;
};

export const AnnotationGridItem = memo(
  ({ selected, handleClick, item, isScrolling }: AnnotationGridItemProps) => {
    const annotation = useAnnotationGridItem(item);
    if (!annotation) return <GridPlaceholder />;
    return (
      <AnnotationCell
        annotation={annotation}
        record={item}
        selected={selected}
        handleClick={handleClick}
        isScrolling={isScrolling}
      />
    );
  },
);

const AnnotationCell = ({
  annotation,
  record,
  selected,
  handleClick,
  isScrolling,
}: Omit<AnnotationGridItemProps, "item"> & {
  annotation: ExtendedAnnotationObject;
  record: AnnotationRecord;
}) => {
  const { category } = annotation;
  const { src } = useRenderedSrc(
    annotation.channelsRef,
    annotation.boundingBox,
  );
  const { containerStyle, textOnScroll } = useGridItemStyle(selected);

  const handleSelect = (evt: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    evt.stopPropagation();
    handleClick(annotation.id, selected);
  };

  const imgElement = src ? (
    <Box
      component="img"
      alt={annotation.imageName}
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
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      })}
    >
      <Typography align="center" variant="body2" sx={altTextStyle}>
        {annotation.imageName}
      </Typography>
      <Typography align="center" variant="body2" sx={altTextStyle}>
        {`w=${annotation.boundingBox[2] - annotation.boundingBox[0]}, h=${annotation.boundingBox[3] - annotation.boundingBox[1]}`}
      </Typography>
    </Box>
  );

  if (isScrolling) {
    return (
      <Box sx={containerStyle}>
        {textOnScroll ? (
          <ScrollingTextDetails annotation={annotation} />
        ) : (
          imgElement
        )}
      </Box>
    );
  }

  return (
    <Box onClick={handleSelect} sx={containerStyle}>
      {imgElement}
      {src && (
        <ItemOverlay
          categoryColor={category.color}
          categoryName={category.name}
          usePredictedStyle={
            annotation.partition === Partition.Inference &&
            !representsUnknown(annotation.categoryId)
              ? annotation.predictionConfidence
              : undefined
          }
          position={getIconPosition(
            annotation.shape.height,
            annotation.shape.width,
          )}
          itemId={annotation.id}
          itemType="annotation"
          item={record}
        />
      )}
    </Box>
  );
};

const ScrollingTextDetails = ({
  annotation,
}: {
  annotation: ExtendedAnnotationObject;
}) => (
  <>
    <br />
    <span style={{ color: annotation.category.color }}>
      Category: {annotation.category.name}
    </span>
    <br />
    Width: {annotation.shape.width}
    <br />
    Height: {annotation.shape.height}
    <br />
    Plane: {annotation.planeIdx}
    <br />
    Partition: {annotation.partition}
  </>
);
