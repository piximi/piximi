import * as React from "react";
import { CirclePicker, ColorResult } from "react-color";
import { useStyles } from "../Application/Application.css";
import { availableColorsSelector } from "../../store/selectors/availableColorsSelecor";
import { Avatar, IconButton, Popover } from "@mui/material";
import { Label } from "@mui/icons-material";
import { useSelector } from "react-redux";

type ColorIconButtonProps = {
  color: string;
  onColorChange: (color: any) => void;
};

export const ColorIcon = ({ color, onColorChange }: ColorIconButtonProps) => {
  const classes = useStyles();

  const availableColors = useSelector(availableColorsSelector);

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
    console.info(color);
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
          <CirclePicker colors={availableColors} onChange={onChange} />
        </div>
      </Popover>
    </>
  );
};
