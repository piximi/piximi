import { memo } from "react";
import { useSelector } from "react-redux";

import { Box } from "@mui/material";

import { ImageDetailContainer } from "./GridItemDetailContainer";

import { selectCategoryProperty } from "store/data/selectors";
import {
  selectImageSelectionColor,
  selectSelectedImageBorderWidth,
  selectTextOnScroll,
  selectTileSize,
} from "store/applicationSettings/selectors";

import { isUnknownCategory } from "store/data/utils";

import { Partition } from "utils/models/enums";

import { ImageGridObject } from "store/data/types";
import { areEqual, GridChildComponentProps } from "react-window";
import { selectSelectedImages } from "store/project/selectors";

type CellData = {
  images: ImageGridObject[];
  handleSelectImage: (id: string, timepoint: number, selected: boolean) => void;
  selectedImages: ReturnType<typeof selectSelectedImages>;
  numColumns: number;
};

export const ImageGridCell = memo(
  ({
    columnIndex,
    rowIndex,
    style,
    isScrolling,
    data,
  }: GridChildComponentProps<CellData>) => {
    const imageIdx = rowIndex * data.numColumns + columnIndex;
    // grid is fixed number of rows x number of columns
    // so there will always be numRows x numCols cells in the grid
    // unless things.length is exactly numRows x numCols
    // there will be empty cells in the grid
    if (imageIdx >= data.images.length) return <></>;

    const image = data.images[imageIdx];

    return (
      <div style={style}>
        <ImageGridItem
          key={image.id}
          image={image}
          handleClick={data.handleSelectImage}
          selected={data.selectedImages[image.id]?.includes(image.timepoint)}
          isScrolling={isScrolling}
        />
      </div>
    );
  },
  areEqual,
);
type ImageGridItem = {
  selected: boolean;
  handleClick: (id: string, timepoint: number, selected: boolean) => void;
  image: ImageGridObject;
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

const ImageGridItem = memo(
  ({ selected, handleClick, image, isScrolling }: ImageGridItem) => {
    const imageSelectionColor = useSelector(selectImageSelectionColor);
    const selectedImageBorderWidth = useSelector(
      selectSelectedImageBorderWidth,
    );
    const scaleFactor = useSelector(selectTileSize);
    const textOnScroll = useSelector(selectTextOnScroll);

    const getCategoryProperty = useSelector(selectCategoryProperty);
    const categoryName = getCategoryProperty(image.categoryId, "name") ?? "";
    const categoryColor = getCategoryProperty(image.categoryId, "color") ?? "";

    const handleSelect = (
      evt: React.MouseEvent<HTMLDivElement, MouseEvent>,
    ) => {
      evt.stopPropagation();
      handleClick(image.id, image.timepoint, selected);
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
            Name: {image.name}
            <br />
            <span style={{ color: categoryColor }}>
              Category: {categoryName}
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
            src={image.src}
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
          src={image.src}
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
          backgroundColor={categoryColor}
          categoryName={categoryName}
          usePredictedStyle={
            image.partition === Partition.Inference &&
            !isUnknownCategory(image.categoryId)
          }
          image={image}
          position={getIconPosition(
            scaleFactor,
            image.shape.height,
            image.shape.width,
          )}
        />
      </Box>
    );
  },
);
