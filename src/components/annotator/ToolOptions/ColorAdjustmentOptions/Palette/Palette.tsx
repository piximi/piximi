import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { tensor2d } from "@tensorflow/tfjs";

import { Grid, IconButton, Menu } from "@mui/material";
import {
  Lens as LensIcon,
  MoreVert as MoreVertIcon,
} from "@mui/icons-material";

import { AnnotatorSlice, activeImageColorsRawSelector } from "store/annotator";

import { DEFAULT_COLORS } from "types";

import { rgbToHex } from "utils/common/image";

type PaletteProps = {
  channelIdx: number;
};

export const Palette = ({ channelIdx }: PaletteProps) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const open = Boolean(anchorEl);

  const colors = useSelector(activeImageColorsRawSelector);

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
    newColor: [number, number, number]
  ) => {
    const updatedColors = colors.color.map((color, i) => {
      return i === channelIdx ? newColor : color;
    });

    dispatch(
      AnnotatorSlice.actions.setImageColors({
        colors: { ...colors, color: tensor2d(updatedColors) },
        execSaga: true,
      })
    );

    handleClose();
  };

  type ColorIconProps = {
    color: [number, number, number];
  };

  type FormRowProps = {
    colors: [number, number, number][];
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
            <FormRow colors={DEFAULT_COLORS.slice(0, 3)} />
          </Grid>
          <Grid container item>
            <FormRow colors={DEFAULT_COLORS.slice(3, 6)} />
          </Grid>
          <Grid container item>
            <ColorIcon color={[1, 1, 1]} />
          </Grid>
        </Grid>
      </Menu>
    </React.Fragment>
  );
};
