import IconButton from "@material-ui/core/IconButton";
import React from "react";
import { useStyles } from "./ImageDialogAppBar.css";
import { AppBar, Button, Toolbar } from "@material-ui/core";
import ClearIcon from "@material-ui/icons/Clear";
import Typography from "@material-ui/core/Typography";
import BrushIcon from "@material-ui/icons/Brush";
import Crop32Icon from "@material-ui/icons/Crop32";
import OpenWithIcon from "@material-ui/icons/OpenWith";
import { SelectionMethod } from "../../types/SelectionMethod";
import ToggleButtonGroup from "@material-ui/lab/ToggleButtonGroup";
import { ToggleButton } from "@material-ui/lab";

type ImageDialogAppBarProps = {
  onClose: () => void;
};

export const ImageDialogAppBar = ({ onClose }: ImageDialogAppBarProps) => {
  const classes = useStyles();

  const [method, setMethod] = React.useState<SelectionMethod>(
    SelectionMethod.RectangularMarquee
  );

  const onChange = (
    event: React.MouseEvent<HTMLElement>,
    method: SelectionMethod
  ) => {
    setMethod(method);
  };

  return (
    <AppBar color="inherit" position="fixed">
      <Toolbar>
        <IconButton
          className={classes.closeButton}
          edge="start"
          color="inherit"
          onClick={onClose}
        >
          <ClearIcon />
        </IconButton>

        <Typography color="inherit" style={{ paddingRight: 20 }} />

        <ToggleButtonGroup exclusive onChange={onChange} value={method}>
          <ToggleButton value={SelectionMethod.RectangularMarquee}>
            <Crop32Icon />
          </ToggleButton>

          <ToggleButton value={SelectionMethod.Quick}>
            <BrushIcon />
          </ToggleButton>
        </ToggleButtonGroup>

        <div className={classes.grow} />

        <IconButton color="inherit" onClick={() => {}}>
          <OpenWithIcon />
        </IconButton>

        <Button />
      </Toolbar>
    </AppBar>
  );
};
