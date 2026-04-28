import { memo } from "react";

import { Box } from "@mui/material";

import { useRenderedSrc } from "hooks/useRenderedSrcs";

import type { Category, ExtendedAnnotationObject } from "store/dataV2/types";
import { isUnknownCategory } from "store/data/utils";
import { selectCategoryById } from "store/dataV2/selectors";
import { useParameterizedSelector } from "store/hooks";

import { Partition } from "utils/modelsV2/enums";

import { getIconPosition, imageStyle } from "../gridItemUtils";
import { useGridItemStyle } from "../useGridItemStyle";
import { ItemOverlay } from "../ItemOverlay";

type AnnotationGridItemProps = {
  selected: boolean;
  handleClick: (id: string, selected: boolean) => void;
  item: ExtendedAnnotationObject;
  isScrolling?: boolean;
};

export const AnnotationGridItem = memo(
  ({ selected, handleClick, item, isScrolling }: AnnotationGridItemProps) => {
    const category = useParameterizedSelector(
      selectCategoryById,
      item.categoryId,
    );

    const { src } = useRenderedSrc(item.channelsRef, item.boundingBox);

    const { containerStyle, textOnScroll } = useGridItemStyle(selected);

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
          {textOnScroll ? (
            <ScrollingTextDetails annotation={item} category={category} />
          ) : (
            imgElement
          )}
        </Box>
      );
    }

    return (
      <Box onClick={handleSelect} sx={containerStyle}>
        {imgElement}
        <ItemOverlay
          categoryColor={category.color}
          categoryName={category.name}
          usePredictedStyle={
            item.partition === Partition.Inference &&
            !isUnknownCategory(item.categoryId)
          }
          position={getIconPosition(item.shape.height, item.shape.width)}
          itemId={item.id}
          itemType="annotation"
        />
      </Box>
    );
  },
);

const ScrollingTextDetails = ({
  annotation,
  category,
}: {
  annotation: ExtendedAnnotationObject;
  category: Category;
}) => (
  <>
    <br />
    <span style={{ color: category.color }}>Category: {category.name}</span>
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
