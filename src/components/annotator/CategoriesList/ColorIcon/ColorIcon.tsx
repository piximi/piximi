import { Label } from "@mui/icons-material";
import * as React from "react";
import { Avatar, IconButton } from "@mui/material";
import Popover from "@mui/material/Popover";
import { CirclePicker, ColorResult } from "react-color";
import { useStyles } from "./ColorIcon.css";

const COLORS = [
  "#f44336",
  "#e91e63",
  "#9c27b0",
  "#673ab7",
  "#3f51b5",
  "#2196f3",
  "#03a9f4",
  "#00bcd4",
  "#009688",
  "#4caf50",
  "#8bc34a",
  "#cddc39",
  "#ffeb3b",
  "#ffc107",
  "#ff9800",
  "#ff5722",
  "#795548",
  "#607d8b",
];

type ColorIconButtonProps = {
  color: string;
  onColorChange: (color: any) => void;
};

export const ColorIcon = ({ color, onColorChange }: ColorIconButtonProps) => {
  const classes = useStyles();

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
        <Avatar style={{ backgroundColor: "#F3F3F3" }}>
          <Label style={{ color: color }} />
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
        <div className={classes.colorPicker}>
          <CirclePicker colors={COLORS} onChange={onChange} />
        </div>
      </Popover>
    </>
  );
};
