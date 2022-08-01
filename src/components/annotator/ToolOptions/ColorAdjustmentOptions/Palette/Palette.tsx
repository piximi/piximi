import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { Grid, IconButton, Menu } from "@mui/material";
import LensIcon from "@mui/icons-material/Lens";
import MoreVertIcon from "@mui/icons-material/MoreVert";

import { imageOriginalSrcSelector } from "store/selectors";
import { activeImagePlaneSelector } from "store/selectors/activeImagePlaneSelector";
import { imageShapeSelector } from "store/selectors/imageShapeSelector";
import { activeImageColorsSelector } from "store/selectors/activeImageColorsSelector";

import { imageViewerSlice } from "store/slices";

import { DEFAULT_COLORS } from "types/DefaultColors";
import { Color } from "types/Color";

import {
  convertImageURIsToImageData,
  mapChannelsToSpecifiedRGBImage,
  rgbToHex,
} from "image/imageHelper";

type PaletteProps = {
  channelIdx: number;
};

export const Palette = ({ channelIdx }: PaletteProps) => {
  const default_colors = DEFAULT_COLORS;

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const open = Boolean(anchorEl);

  const colors = useSelector(activeImageColorsSelector);

  const activeImagePlane = useSelector(activeImagePlaneSelector);

  const imageShape = useSelector(imageShapeSelector);

  const originalSrc = useSelector(imageOriginalSrcSelector);

  const dispatch = useDispatch();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const assignColor = async (
    event:
      | React.MouseEvent<HTMLAnchorElement>
      | React.MouseEvent<HTMLButtonElement>,
    newColor: Array<number>
  ) => {
    const updatedColors: Array<Color> = colors.map(
      (color: Color, i: number) => {
        return i === channelIdx ? { ...color, color: newColor } : color;
      }
    );

    dispatch(
      imageViewerSlice.actions.setImageColors({ colors: updatedColors })
    );

    if (!originalSrc || !imageShape) return;

    const activePlaneData = (
      await convertImageURIsToImageData(
        new Array(originalSrc[activeImagePlane])
      )
    )[0];

    const modifiedURI = mapChannelsToSpecifiedRGBImage(
      activePlaneData,
      updatedColors,
      imageShape.height,
      imageShape.width
    );
    dispatch(imageViewerSlice.actions.setImageSrc({ src: modifiedURI }));

    handleClose();
  };

  type ColorIconProps = {
    color: Array<number>;
  };

  type FormRowProps = {
    colors: Array<Array<number>>;
  };

  const ColorIcon = ({ color }: ColorIconProps) => {
    return (
      <IconButton
        onClick={(
          event:
            | React.MouseEvent<HTMLAnchorElement>
            | React.MouseEvent<HTMLButtonElement>
        ) => assignColor(event, color)}
      >
        <LensIcon sx={{ fill: rgbToHex(color) }} />
      </IconButton>
    );
  };

  const FormRow = ({ colors }: FormRowProps) => {
    return (
      <React.Fragment>
        <Grid item xs={4}>
          <ColorIcon color={colors[0]} />
        </Grid>
        <Grid item xs={4}>
          <ColorIcon color={colors[1]} />
        </Grid>
        <Grid item xs={4}>
          <ColorIcon color={colors[2]} />
        </Grid>
      </React.Fragment>
    );
  };

  return (
    <React.Fragment>
      <IconButton onClick={handleClick}>
        <MoreVertIcon />
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <Grid>
          <Grid container item>
            <FormRow colors={default_colors.slice(0, 3)} />
          </Grid>
          <Grid container item>
            <FormRow colors={default_colors.slice(3, 6)} />
          </Grid>
          <Grid container item>
            <ColorIcon color={[255, 255, 255]} />
          </Grid>
        </Grid>
      </Menu>
    </React.Fragment>
  );
};
