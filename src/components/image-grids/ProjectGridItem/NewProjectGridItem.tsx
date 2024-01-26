import { memo, useMemo } from "react";
import { useSelector } from "react-redux";

import {
  Box,
  Grid,
  Typography,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import {
  InfoOutlined as InfoOutlinedIcon,
  Label as LabelIcon,
  LabelImportant as LabelImportantIcon,
} from "@mui/icons-material";

import {
  selectImageSelectionColor,
  selectSelectedImageBorderWidth,
  selectTileSize,
} from "store/slices/applicationSettings";
import { ItemDetailTooltip } from "./ItemDetailTooltip";
import { selectImageCategoryProperty } from "store/slices/data";
import { NewAnnotationType } from "types/AnnotationType";
import { NewImageType } from "types/ImageType";
import { NEW_UNKNOWN_CATEGORY_ID, Partition } from "types";

type ProjectGridItemProps = {
  selected: boolean;
  handleClick: (id: string, selected: boolean) => void;
  thing: NewImageType | NewAnnotationType;
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

export const NewProjectGridItem = memo(
  ({ selected, handleClick, thing }: ProjectGridItemProps) => {
    const imageSelectionColor = useSelector(selectImageSelectionColor);
    const selectedImageBorderWidth = useSelector(
      selectSelectedImageBorderWidth
    );
    const scaleFactor = useSelector(selectTileSize);

    const getImageCategoryProperty = useSelector(selectImageCategoryProperty);

    const categoryDetails = useMemo(() => {
      const categoryName = getImageCategoryProperty(thing.categoryId, "name")!;
      const categoryColor = getImageCategoryProperty(
        thing.categoryId,
        "color"
      )!;
      return {
        name: categoryName,
        color: categoryColor,
        fontColor: "white",
      };
    }, [thing, getImageCategoryProperty]);

    const iconPosition = useMemo(
      () =>
        getIconPosition(scaleFactor, thing.shape?.height, thing.shape?.width),
      [scaleFactor, thing]
    );

    const isPredicted = useMemo(
      () =>
        thing.partition === Partition.Inference &&
        thing.categoryId !== NEW_UNKNOWN_CATEGORY_ID,
      [thing]
    );
    const imageDetailComponent = useMemo(() => {
      return (
        <List dense>
          <ListItem>
            <ListItemText
              primary={`Image name: ${thing.name}`}
              primaryTypographyProps={{
                sx: { color: categoryDetails.fontColor },
              }}
            />
          </ListItem>
          {thing.shape && (
            <>
              <ListItem>
                <ListItemText
                  primary={`Width: ${thing.shape.width} px`}
                  primaryTypographyProps={{
                    sx: { color: categoryDetails.fontColor },
                  }}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary={`Height: ${thing.shape.height} px`}
                  primaryTypographyProps={{
                    sx: { color: categoryDetails.fontColor },
                  }}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary={`Channels: ${thing.shape.channels}`}
                  primaryTypographyProps={{
                    sx: { color: categoryDetails.fontColor },
                  }}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary={`Planes: ${thing.shape.planes}`}
                  primaryTypographyProps={{
                    sx: { color: categoryDetails.fontColor },
                  }}
                />
              </ListItem>
            </>
          )}
          <ListItem>
            <ListItemText
              primary={`Partition: ${thing.partition}`}
              primaryTypographyProps={{
                sx: { color: categoryDetails.fontColor },
              }}
            />
          </ListItem>
        </List>
      );
    }, [thing, categoryDetails.fontColor]);

    const actionIconStyle = useMemo(
      () => ({
        color: categoryDetails!.color,
        marginLeft: "8px",
        marginTop: "8px",
      }),
      [categoryDetails]
    );
    const handleSelect = (
      evt: React.MouseEvent<HTMLDivElement, MouseEvent>
    ) => {
      evt.stopPropagation();
      handleClick(thing.id, selected);
    };

    return (
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
        />

        <Box
          position="absolute"
          top={iconPosition?.top + "px"}
          left={iconPosition?.left + "px"}
        >
          <ItemDetailTooltip
            contents={
              <Typography color={categoryDetails?.fontColor} variant="body2">
                {categoryDetails!.name}
              </Typography>
            }
            color={categoryDetails!.color}
          >
            {isPredicted ? (
              <LabelImportantIcon sx={actionIconStyle} />
            ) : (
              <LabelIcon sx={actionIconStyle} />
            )}
          </ItemDetailTooltip>

          <Box sx={{ flexGrow: 1 }} />

          <ItemDetailTooltip
            contents={imageDetailComponent!}
            color={categoryDetails!.color}
          >
            <InfoOutlinedIcon sx={actionIconStyle} />
          </ItemDetailTooltip>
        </Box>
      </Grid>
    );
  }
);
