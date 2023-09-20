import { memo, useMemo } from "react";
import { useSelector } from "react-redux";

import { List, ListItem, ListItemText } from "@mui/material";

import { selectTileSize } from "store/application";
import { selectAnnotationCategoryProperty } from "store/data";

import { contrastingText } from "utils/common/colorPalette";
import { ProjectGridItem } from "../ProjectGridItem";
import { AnnotationItemDetails } from "../AnnotationImageGrid";

type ImageGridItemProps = {
  selected: boolean;
  handleClick: (id: string) => void;
  details: AnnotationItemDetails;
};

export const AnnotationGridItem = memo(
  ({ selected, handleClick, details }: ImageGridItemProps) => {
    const scaleFactor = useSelector(selectTileSize);

    const getAnnotationCategoryProperty = useSelector(
      selectAnnotationCategoryProperty
    );

    const categoryDetails = useMemo(() => {
      const categoryName = getAnnotationCategoryProperty(
        details.category,
        "name"
      )!;
      const categoryColor = getAnnotationCategoryProperty(
        details.category,
        "color"
      )!;
      return {
        name: categoryName,
        color: categoryColor,
        fontColor: contrastingText(categoryColor),
      };
    }, [details, getAnnotationCategoryProperty]);

    const imageDetailComponent = useMemo(() => {
      return (
        <List dense>
          <ListItem>
            <ListItemText
              primary={`Image name: ${details.name}`}
              primaryTypographyProps={{
                sx: { color: categoryDetails.fontColor },
              }}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={`Width: ${details.width} px`}
              primaryTypographyProps={{
                sx: { color: categoryDetails.fontColor },
              }}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={`Height: ${details.height} px`}
              primaryTypographyProps={{
                sx: { color: categoryDetails.fontColor },
              }}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={`Area: ${details.area} px`}
              primaryTypographyProps={{
                sx: { color: categoryDetails.fontColor },
              }}
            />
          </ListItem>
        </List>
      );
    }, [details, categoryDetails.fontColor]);

    const itemSize = useMemo(() => {
      return (220 * scaleFactor).toString() + "px";
    }, [scaleFactor]);

    const iconPosition = useMemo(() => {
      const containerSize = 220 * scaleFactor;
      const scaleBy =
        details.width > details.height ? details.width : details.height;
      const dimScaleFactor = containerSize / scaleBy;
      const scaledWidth = dimScaleFactor * details.width;
      const scaledHeight = dimScaleFactor * details.height;

      const offsetY = Math.ceil((containerSize - scaledHeight) / 2);
      const offsetX = Math.ceil((containerSize - scaledWidth) / 2);

      return { top: offsetY, left: offsetX };
    }, [details, scaleFactor]);

    const handleSelect = (
      evt: React.MouseEvent<HTMLDivElement, MouseEvent>
    ) => {
      evt.stopPropagation();
      handleClick(details.id);
    };

    return (
      <ProjectGridItem
        handleClick={handleSelect}
        categoryDetails={categoryDetails}
        imageDetail={imageDetailComponent}
        iconPosition={iconPosition}
        imageSize={itemSize}
        src={details.src}
        selected={selected}
        isPredicted={false}
      />
    );
  }
);
