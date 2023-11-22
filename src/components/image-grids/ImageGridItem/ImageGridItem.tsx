import { memo, useMemo } from "react";
import { useSelector } from "react-redux";

import { List, ListItem, ListItemText } from "@mui/material";

import { selectTileSize } from "store/applicationSettings";
import { selectImageCategoryProperty } from "store/data";

import { ImageType, Partition, UNKNOWN_IMAGE_CATEGORY_ID } from "types";
import { ProjectGridItem } from "../ProjectGridItem";
import { contrastingText } from "utils/common/colorPalette";

type ImageGridItemProps = {
  selected: boolean;
  handleClick: (id: string, selected: boolean) => void;
  image: ImageType;
};

export const ImageGridItem = memo(
  ({ selected, handleClick, image }: ImageGridItemProps) => {
    const scaleFactor = useSelector(selectTileSize);

    const getImageCategoryProperty = useSelector(selectImageCategoryProperty);

    const categoryDetails = useMemo(() => {
      const categoryName = getImageCategoryProperty(image.categoryId, "name")!;
      const categoryColor = getImageCategoryProperty(
        image.categoryId,
        "color"
      )!;
      return {
        name: categoryName,
        color: categoryColor,
        fontColor: contrastingText(categoryColor),
      };
    }, [image, getImageCategoryProperty]);
    const imageDetailComponent = useMemo(() => {
      return (
        <List dense>
          <ListItem>
            <ListItemText
              primary={`Image name: ${image.name}`}
              primaryTypographyProps={{
                sx: { color: categoryDetails.fontColor },
              }}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={`Width: ${image.shape.width} px`}
              primaryTypographyProps={{
                sx: { color: categoryDetails.fontColor },
              }}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={`Height: ${image.shape.height} px`}
              primaryTypographyProps={{
                sx: { color: categoryDetails.fontColor },
              }}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={`Channels: ${image.shape.channels}`}
              primaryTypographyProps={{
                sx: { color: categoryDetails.fontColor },
              }}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={`Planes: ${image.shape.planes}`}
              primaryTypographyProps={{
                sx: { color: categoryDetails.fontColor },
              }}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={`Partition: ${image.partition}`}
              primaryTypographyProps={{
                sx: { color: categoryDetails.fontColor },
              }}
            />
          </ListItem>
        </List>
      );
    }, [image, categoryDetails.fontColor]);

    const itemSize = useMemo(() => {
      return (220 * scaleFactor).toString() + "px";
    }, [scaleFactor]);

    const iconPosition = useMemo(() => {
      const containerSize = 220 * scaleFactor;
      const scaleBy =
        image.shape.width > image.shape.height
          ? image.shape.width
          : image.shape.height;
      const dimScaleFactor = containerSize / scaleBy;
      const scaledWidth = dimScaleFactor * image.shape.width;
      const scaledHeight = dimScaleFactor * image.shape.height;

      const offsetY = Math.ceil((containerSize - scaledHeight) / 2);
      const offsetX = Math.ceil((containerSize - scaledWidth) / 2);

      return { top: offsetY, left: offsetX };
    }, [image, scaleFactor]);

    const handleSelect = (
      evt: React.MouseEvent<HTMLDivElement, MouseEvent>
    ) => {
      evt.stopPropagation();
      handleClick(image.id, selected);
    };

    return (
      <ProjectGridItem
        handleClick={handleSelect}
        categoryDetails={categoryDetails}
        imageDetail={imageDetailComponent}
        iconPosition={iconPosition}
        imageSize={itemSize}
        src={image.src}
        selected={selected}
        isPredicted={
          image.partition === Partition.Inference &&
          image.categoryId !== UNKNOWN_IMAGE_CATEGORY_ID
        }
      />
    );
  }
);
