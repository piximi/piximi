import { memo, useMemo } from "react";
import { useSelector } from "react-redux";

import { Box, Grid, Typography } from "@mui/material";
import {
  InfoOutlined as InfoOutlinedIcon,
  Label as LabelIcon,
  LabelImportant as LabelImportantIcon,
} from "@mui/icons-material";

import {
  selectImageSelectionColor,
  selectSelectedImageBorderWidth,
} from "store/applicationSettings";
import { ItemDetailTooltip } from "./ItemDetailTooltip";

type ProjectGridItemProps = {
  selected?: boolean;
  handleClick?: (evt: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  categoryDetails?: { name: string; color: string; fontColor: string };
  imageDetail?: JSX.Element;
  iconPosition?: { top: number; left: number };
  imageSize?: string;
  src?: string;
  isPredicted?: boolean;
};

export const ProjectGridItem = memo(
  ({
    selected,
    handleClick,
    categoryDetails,
    imageDetail,
    iconPosition,
    imageSize,
    src,
    isPredicted,
  }: ProjectGridItemProps) => {
    const imageSelectionColor = useSelector(selectImageSelectionColor);
    const selectedImageBorderWidth = useSelector(
      selectSelectedImageBorderWidth
    );

    const actionIconStyle = useMemo(
      () => ({
        color: categoryDetails!.color,
        marginLeft: "8px",
        marginTop: "8px",
      }),
      [categoryDetails]
    );

    return (
      <Grid
        item
        position="relative" // must be a position element for absolutely positioned ImageIconLabel
        onClick={handleClick}
        sx={{
          width: imageSize,
          height: imageSize,
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
          src={src}
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
            contents={imageDetail!}
            color={categoryDetails!.color}
          >
            <InfoOutlinedIcon sx={actionIconStyle} />
          </ItemDetailTooltip>
        </Box>
      </Grid>
    );
  }
);
