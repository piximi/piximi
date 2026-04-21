import { CSSProperties, memo } from "react";
import { useSelector } from "react-redux";

import { Box } from "@mui/material";

import { AnnotationDetailContainer } from "./AnnotationDetailContainer";

import {
  selectImageSelectionColor,
  selectSelectedImageBorderWidth,
  selectTextOnScroll,
} from "store/applicationSettings/selectors";

import { isUnknownCategory } from "store/data/utils";

import { Partition } from "utils/models/enums";

import { Category, ExtendedAnnotationObject } from "store/dataV2/types";

import { useRenderedSrc } from "hooks/useRenderedSrcs";
import { selectCategoryById } from "store/dataV2/selectors";
import { useParameterizedSelector } from "store/hooks";

type AnnotationGridItemProps = {
  selected: boolean;
  handleClick: (id: string, selected: boolean) => void;
  annotation: ExtendedAnnotationObject;
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

export const AnnotationGridItem = memo(
  ({
    selected,
    handleClick,
    annotation,
    isScrolling,
  }: AnnotationGridItemProps) => {
    const imageSelectionColor = useSelector(selectImageSelectionColor);
    const selectedImageBorderWidth = useSelector(
      selectSelectedImageBorderWidth,
    );
    const category = useParameterizedSelector(
      selectCategoryById,
      annotation.categoryId,
    );
    const textOnScroll = useSelector(selectTextOnScroll);

    const { src } = useRenderedSrc(
      annotation.imageChannels,
      annotation.boundingBox,
    );

    const handleSelect = (
      evt: React.MouseEvent<HTMLDivElement, MouseEvent>,
    ) => {
      evt.stopPropagation();
      handleClick(annotation.id, selected);
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
        <AnnotationDetailContainer
          backgroundColor={category.color}
          categoryName={category.name}
          usePredictedStyle={
            annotation.partition === Partition.Inference &&
            !isUnknownCategory(annotation.categoryId)
          }
          annotation={annotation}
          position={getIconPosition(
            annotation.shape.height,
            annotation.shape.width,
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
