import { memo } from "react";
import { useSelector } from "react-redux";

import { Box, Grid } from "@mui/material";

import { ThingDetailContainer } from "./ThingDetailContainer";
import {
  selectImageSelectionColor,
  selectSelectedImageBorderWidth,
  selectTileSize,
} from "store/applicationSettings";
import { selectCategoryProperty } from "store/data/selectors/reselectors";
import { isUnknownCategory } from "utils/common/helpers";
import { Partition } from "utils/models/enums";
import { AnnotationObject, ImageObject } from "store/data/types";

type ProjectGridItemProps = {
  selected: boolean;
  handleClick: (id: string, selected: boolean) => void;
  thing: ImageObject | AnnotationObject;
  filtered: boolean;
};

const getIconPosition = (
  scale: number,
  height: number | undefined,
  width: number | undefined
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

export const ProjectGridItemNew = memo(
  ({ selected, handleClick, thing, filtered }: ProjectGridItemProps) => {
    const imageSelectionColor = useSelector(selectImageSelectionColor);
    const selectedImageBorderWidth = useSelector(
      selectSelectedImageBorderWidth
    );
    const scaleFactor = useSelector(selectTileSize);

    const getCategoryProperty = useSelector(selectCategoryProperty);
    const categoryName = getCategoryProperty(thing.categoryId, "name") ?? "";
    const categoryColor = getCategoryProperty(thing.categoryId, "color") ?? "";

    const handleSelect = (
      evt: React.MouseEvent<HTMLDivElement, MouseEvent>
    ) => {
      evt.stopPropagation();
      handleClick(thing.id, selected);
    };

    return filtered ? (
      <></>
    ) : (
      <Grid
        item
        position="relative" // must be a position element for absolutely positioned ImageIconLabel
        onClick={handleSelect}
        sx={{
          width: printSize(scaleFactor),
          height: printSize(scaleFactor),
          margin: "2px",
          border: `solid ${selectedImageBorderWidth}px ${
            selected ? imageSelectionColor : "transparent"
          }`,
          borderRadius: selectedImageBorderWidth + "px",
        }}
        //onContextMenu={() => handleContextSelectImage(itemDetails.id)}
      >
        <Box
          component="img"
          alt=""
          src={thing.src}
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            top: 0,
            transform: "none",
          }}
          draggable={false}
        />
        <ThingDetailContainer
          backgroundColor={categoryColor}
          categoryName={categoryName}
          usePredictedStyle={
            thing.partition === Partition.Inference &&
            !isUnknownCategory(thing.categoryId)
          }
          thing={thing}
          position={getIconPosition(
            scaleFactor,
            thing.shape.height,
            thing.shape.width
          )}
        />
      </Grid>
    );
  }
);
