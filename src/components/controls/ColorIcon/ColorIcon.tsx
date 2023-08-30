import * as React from "react";
import { CirclePicker, ColorResult } from "react-color";

import { Avatar, IconButton, Popover, Box } from "@mui/material";
import { Label } from "@mui/icons-material";

type ColorIconButtonProps = {
  color: string;
  onColorChange: (color: any) => void;
  unusedColors?: string[];
};

export const ColorIcon = ({
  color,
  onColorChange,
  unusedColors,
}: ColorIconButtonProps) => {
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
  //TODO: should be dialog and button
  return (
    <React.Fragment>
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
          <CirclePicker colors={unusedColors} onChange={onChange} />
        </Box>
      </Popover>
    </React.Fragment>
  );
};
