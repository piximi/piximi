import { memo } from "react";

import { Box } from "@mui/material";

import { isUnknownCategory } from "store/data/utils";

import { Partition } from "utils/models/enums";

import { Category, ExtendedAnnotationObject } from "store/dataV2/types";

import { useRenderedSrc } from "hooks/useRenderedSrcs";
import { selectCategoryById } from "store/dataV2/selectors";
import { useParameterizedSelector } from "store/hooks";
import { getIconPosition, imageStyle } from "../../gridItemUtils";
import { useGridItemStyle } from "../../useGridItemStyle";
import { ItemDetailContainer } from "../../ItemDetailContainer";
import { AnnotationDetailList } from "./AnnotationDetailList";

type AnnotationGridItemProps = {
  selected: boolean;
  handleClick: (id: string, selected: boolean) => void;
  annotation: ExtendedAnnotationObject;
  isScrolling?: boolean;
};

export const AnnotationGridItem = memo(
  ({
    selected,
    handleClick,
    annotation,
    isScrolling,
  }: AnnotationGridItemProps) => {
    const category = useParameterizedSelector(
      selectCategoryById,
      annotation.categoryId,
    );

    const { src } = useRenderedSrc(
      annotation.imageChannels,
      annotation.boundingBox,
    );

    const { containerStyle, textOnScroll } = useGridItemStyle(selected);

    const handleSelect = (
      evt: React.MouseEvent<HTMLDivElement, MouseEvent>,
    ) => {
      evt.stopPropagation();
      handleClick(annotation.id, selected);
    };

    const imgElement = (
      <Box component="img" alt="" src={src} sx={imageStyle} draggable={false} />
    );

    if (isScrolling) {
      return (
        <Box sx={containerStyle}>
          {textOnScroll ? (
            <ScrollingTextDetails annotation={annotation} category={category} />
          ) : (
            imgElement
          )}
        </Box>
      );
    }

    return (
      <Box onClick={handleSelect} sx={containerStyle}>
        {imgElement}
        <ItemDetailContainer
          backgroundColor={category.color}
          categoryName={category.name}
          usePredictedStyle={
            annotation.partition === Partition.Inference &&
            !isUnknownCategory(annotation.categoryId)
          }
          position={getIconPosition(
            annotation.shape.height,
            annotation.shape.width,
          )}
          renderDetailList={(color) => (
            <AnnotationDetailList annotation={annotation} color={color} />
          )}
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
