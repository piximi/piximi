import { Label } from "@material-ui/icons";
import * as React from "react";
import { Avatar, IconButton } from "@material-ui/core";
import Popover from "@material-ui/core/Popover";
import { CirclePicker, ColorResult } from "react-color";
import { useStyles } from "../../index.css";
import { COLORS } from "../../store";

type ColorIconButtonProps = {
  color: string;
  onColorChange: (color: any) => void;
};

export const ColorIcon = ({ color, onColorChange }: ColorIconButtonProps) => {
  const classes = useStyles();

  const [
    colorMenuAnchorEl,
    setColorMenuAnchorEl,
  ] = React.useState<null | HTMLButtonElement>(null);

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
          <CirclePicker colors={COLORS} onChange={onChange} />
        </div>
      </Popover>
    </React.Fragment>
  );
};
