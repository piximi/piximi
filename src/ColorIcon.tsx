import { Label } from "@material-ui/icons";
import * as React from "react";
import { Avatar, IconButton } from "@material-ui/core";
import Popover from "@material-ui/core/Popover";
import { CirclePicker } from "react-color";
import { useStyles } from "./index.css";
import { useCallback, useState } from "react";

type ColorIconButtonProps = {
  color?: string;
  onColorChange: (color: any) => void;
};

export const ColorIcon = ({ color, onColorChange }: ColorIconButtonProps) => {
  if (!color) {
    const color = "#" + Math.floor(Math.random() * 16777215).toString(16);
    // const color = (props.color !== "#00e676") ? props.color : '#'+(Math.floor(Math.random()*16777215).toString(16));
  }

  //const color = props.color;

  // const color = props.color
  const classes = useStyles();

  const [
    colorMenuAnchorEl,
    setColorMenuAnchorEl,
  ] = React.useState<null | HTMLButtonElement>(null);

  const [openColorDialog, setOpenColorDialog] = React.useState(false);

  const colorPopupOpen = Boolean(colorMenuAnchorEl);

  const onOpenColorPicker = (event: React.MouseEvent<HTMLButtonElement>) => {
    setColorMenuAnchorEl(event.currentTarget);
  };

  const onCloseColorPicker = () => {
    setColorMenuAnchorEl(null);
  };

  const handleColorChange = (color: any) => {
    onColorChange(color);
    onCloseColorPicker();
  };

  return (
    <React.Fragment>
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
          <CirclePicker color={color} onChange={handleColorChange} />
        </div>
      </Popover>
    </React.Fragment>
  );
};
