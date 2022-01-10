import { Label } from "@mui/icons-material";
import * as React from "react";
import { Avatar, IconButton, Box } from "@mui/material";
import Popover from "@mui/material/Popover";
import { CirclePicker, ColorResult } from "react-color";

export const COLORS = [
  "#000000",
  "#004949",
  "#009292",
  "#ff6db6",
  "#ffb6db",
  "#490092",
  "#006ddb",
  "#b66dff",
  "#6db6ff",
  "#b6dbff",
  "#920000",
  "#924900",
  "#db6d00",
  "#24ff24",
  "#ffff6d",
];

type ColorIconButtonProps = {
  color: string;
  onColorChange: (color: any) => void;
};

export const ColorIcon = ({ color, onColorChange }: ColorIconButtonProps) => {
  const [colorMenuAnchorEl, setColorMenuAnchorEl] =
    React.useState<null | HTMLButtonElement>(null);

  const colorPopupOpen = Boolean(colorMenuAnchorEl);

  const onOpenColorPicker = (event: React.MouseEvent<HTMLButtonElement>) => {
    setColorMenuAnchorEl(event.currentTarget);
  };

  const onCloseColorPicker = () => {
    setColorMenuAnchorEl(null);
  };

  const onChange = (color: ColorResult) => {
    onColorChange(color);
    onCloseColorPicker();
  };

  return (
    <>
      <IconButton onClick={onOpenColorPicker}>
        <Avatar sx={{ backgroundColor: "#F3F3F3" }}>
          <Label sx={{ color: color }} />
        </Avatar>
      </IconButton>
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
        <Box sx={{ margin: "16px" }}>
          <CirclePicker colors={COLORS} onChange={onChange} />
        </Box>
      </Popover>
    </>
  );
};
