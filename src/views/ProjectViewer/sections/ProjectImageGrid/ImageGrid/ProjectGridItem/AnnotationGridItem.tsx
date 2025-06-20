import { memo } from "react";
import { useSelector } from "react-redux";
import { areEqual, GridChildComponentProps } from "react-window";

import { Box } from "@mui/material";

import { AnnotationDetailContainer } from "./GridItemDetailContainer";

import { selectCategoryProperty } from "store/data/selectors";
import {
  selectImageSelectionColor,
  selectSelectedImageBorderWidth,
  selectTextOnScroll,
  selectTileSize,
} from "store/applicationSettings/selectors";

import { isUnknownCategory } from "store/data/utils";

import { Partition } from "utils/models/enums";

import { TSAnnotationObject } from "store/data/types";

type SelectHandler = (id: string, selected: boolean) => void;
type SelectedAnnotationIds = string[];
type CellData = {
  annotations: TSAnnotationObject[];
  handleSelectAnnotation: SelectHandler;
  selectedAnnotationIds: SelectedAnnotationIds;
  numColumns: number;
};

export const AnnotationGridCell = memo(
  ({
    columnIndex,
    rowIndex,
    style,
    isScrolling,
    data,
  }: GridChildComponentProps<CellData>) => {
    const annotationIdx = rowIndex * data.numColumns + columnIndex;
    // grid is fixed number of rows x number of columns
    // so there will always be numRows x numCols cells in the grid
    // unless things.length is exactly numRows x numCols
    // there will be empty cells in the grid
    if (annotationIdx >= data.annotations.length) return <></>;

    const annotation = data.annotations[annotationIdx];

    return (
      <div style={style}>
        <AnnotationGridItem
          key={annotation.id}
          annotation={annotation}
          handleClick={data.handleSelectAnnotation}
          selected={data.selectedAnnotationIds.includes(annotation.id)}
          isScrolling={isScrolling}
        />
      </div>
    );
  },
  areEqual,
);

type AnnotationGridItemProps = {
  selected: boolean;
  handleClick: (id: string, selected: boolean) => void;
  annotation: TSAnnotationObject;
  isScrolling?: boolean;
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

const AnnotationGridItem = memo(
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
    const scaleFactor = useSelector(selectTileSize);
    const textOnScroll = useSelector(selectTextOnScroll);

    const getCategoryProperty = useSelector(selectCategoryProperty);
    const categoryName =
      getCategoryProperty(annotation.categoryId, "name") ?? "";
    const categoryColor =
      getCategoryProperty(annotation.categoryId, "color") ?? "";

    const handleSelect = (
      evt: React.MouseEvent<HTMLDivElement, MouseEvent>,
    ) => {
      evt.stopPropagation();
      handleClick(annotation.id, selected);
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
          width: printSize(scaleFactor),
          height: printSize(scaleFactor),
        }}
      >
        {textOnScroll ? (
          <>
            Name: {annotation.name}
            <br />
            <span style={{ color: categoryColor }}>
              Category: {categoryName}
            </span>
            <br />
            Width: {annotation.shape.width}
            <br />
            Height: {annotation.shape.height}
            <br />
            Channels: {annotation.shape.channels}
            <br />
            Planes: {annotation.shape.planes}
            <br />
            Partition: {annotation.partition}
          </>
        ) : (
          <Box
            component="img"
            alt=""
            src={annotation.src}
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
          width: printSize(scaleFactor),
          height: printSize(scaleFactor),
        }}
      >
        <Box
          component="img"
          alt=""
          src={annotation.src}
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            top: 0,
            transform: "none",
          }}
          draggable={false}
        />
        <AnnotationDetailContainer
          backgroundColor={categoryColor}
          categoryName={categoryName}
          usePredictedStyle={
            annotation.partition === Partition.Inference &&
            !isUnknownCategory(annotation.categoryId)
          }
          annotation={annotation}
          position={getIconPosition(
            scaleFactor,
            annotation.shape.height,
            annotation.shape.width,
          )}
        />
      </Box>
    );
  },
);
