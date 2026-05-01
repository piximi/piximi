import { useState, MouseEvent, Fragment } from "react";

import { ChromePicker, ColorResult } from "react-color";

import { Popover, Box } from "@mui/material";
import {
  Label,
  ArrowDropDown as ArrowDropDownIcon,
  ArrowDropUp as ArrowDropUpIcon,
} from "@mui/icons-material";

type ColorIconButtonProps = {
  color: string;
  onColorChange: (color: any) => void;
};

export const ColorPicker = ({ color, onColorChange }: ColorIconButtonProps) => {
  const [colorMenuAnchorEl, setColorMenuAnchorEl] =
    useState<null | HTMLDivElement>(null);

  const colorPopupOpen = Boolean(colorMenuAnchorEl);

  const onOpenColorPicker = (event: MouseEvent<HTMLDivElement>) => {
    if (colorPopupOpen) {
      setColorMenuAnchorEl(null);
    } else {
      setColorMenuAnchorEl(event.currentTarget);
    }
  };

  const onCloseColorPicker = () => {
    setColorMenuAnchorEl(null);
  };

  const onChange = (color: ColorResult) => {
    onColorChange(color);
  };
  return (
    <Fragment>
      <Box
        display="flex"
        flexDirection={"row"}
        alignItems={"center"}
        component={"div"}
        onClick={onOpenColorPicker}
        sx={(theme) => ({
          p: 1,
          gap: 2,
          borderRadius: 1,
          " :hover": {
            backgroundColor: theme.palette.action.hover,
          },
        })}
      >
        <Label sx={{ color: color }} />

        {colorPopupOpen ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
      </Box>
      <Popover
        id="color-menu"
        open={colorPopupOpen}
        anchorEl={colorMenuAnchorEl}
        onClose={onCloseColorPicker}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
      >
        <ChromePicker color={color} onChange={onChange} />
      </Popover>
    </Fragment>
  );
};
