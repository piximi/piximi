import React from "react";
import { Grid, IconButton, Menu } from "@mui/material";
import LensIcon from "@mui/icons-material/Lens";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { DEFAULT_COLORS } from "../../../../../types/Colors";
import {
  mapChannelstoSpecifiedRGBImage,
  rgbToHex,
} from "../../../../../image/imageHelper";
import { imageViewerSlice } from "../../../../../store/slices";
import { channelsSelector } from "../../../../../store/selectors/intensityRangeSelector";
import { useDispatch, useSelector } from "react-redux";
import { ChannelType } from "../../../../../types/ChannelType";
import { imageOriginalSrcSelector } from "../../../../../store/selectors";
import { activeImagePlaneSelector } from "../../../../../store/selectors/activeImagePlaneSelector";
import { imageShapeSelector } from "../../../../../store/selectors/imageShapeSelector";

type PaletteProps = {
  channelIdx: number;
};

export const Palette = ({ channelIdx }: PaletteProps) => {
  const default_colors = DEFAULT_COLORS;

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const open = Boolean(anchorEl);

  const colors = useSelector(channelsSelector);

  const originalData = useSelector(imageOriginalSrcSelector);

  const activeImagePlane = useSelector(activeImagePlaneSelector);

  const imageShape = useSelector(imageShapeSelector);

  const dispatch = useDispatch();

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
    newColor: Array<number>
  ) => {
    const updatedColors: Array<ChannelType> = colors.map(
      (color: ChannelType, i: number) => {
        return i === channelIdx ? { ...color, color: newColor } : color;
      }
    );

    dispatch(imageViewerSlice.actions.setChannels({ channels: updatedColors }));

    if (!originalData || !imageShape) return;

    const modifiedURI = mapChannelstoSpecifiedRGBImage(
      originalData[activeImagePlane],
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
