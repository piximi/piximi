import React from "react";
import { Grid, IconButton, Menu } from "@mui/material";
import LensIcon from "@mui/icons-material/Lens";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { DEFAULT_COLORS } from "../../../../../types/Colors";
import { rgbToHex } from "../../../../../image/imageHelper";

type PaletteProps = {
  channelIdx: number;
};

export const Palette = ({ channelIdx }: PaletteProps) => {
  const default_colors = DEFAULT_COLORS;

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const assignColor = (
    event:
      | React.MouseEvent<HTMLAnchorElement>
      | React.MouseEvent<HTMLButtonElement>,
    color: Array<number>
  ) => {
    //TODO obtain the channel index (a number), and update with color passed to function
    console.info(color, channelIdx);
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
        </Grid>
      </Menu>
    </React.Fragment>
  );
};
