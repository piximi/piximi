import { memo, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";

import { List, ListItem, ListItemText } from "@mui/material";

import { selectTileSize } from "store/application";

import { contrastingText } from "utils/common/colorPalette";
import { ProjectGridItem } from "../ProjectGridItem";
import { AnnotationItemDetails } from "../AnnotationImageGrid";
import { Category } from "types";

type ImageGridItemProps = {
  selected: boolean;
  handleClick: (id: string, selected: boolean) => void;
  details: AnnotationItemDetails;
  category: Category;
};

export const AnnotationGridItem = memo(
  ({ selected, handleClick, details, category }: ImageGridItemProps) => {
    const scaleFactor = useSelector(selectTileSize);
    const [categoryDetails, setCategoryDetails] = useState({
      name: category.name,
      color: category.color,
      fontColor: contrastingText(category.color),
    });

    const imageDetailComponent = useMemo(() => {
      return (
        <List dense>
          <ListItem>
            <ListItemText
              primary={`Image name: ${categoryDetails.name}`}
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
    }, [details, categoryDetails]);

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
      handleClick(details.id, selected);
    };

    useEffect(() => {
      setCategoryDetails({
        name: category.name,
        color: category.color,
        fontColor: contrastingText(category.color),
      });
    }, [category]);

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
