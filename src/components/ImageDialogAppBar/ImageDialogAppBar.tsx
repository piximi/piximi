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
import { useDispatch, useSelector } from "react-redux";
import { selectionMethodSelector } from "../../store/selectors/selectionMethodSelector";
import { applicationSlice } from "../../store/slices";
import Tooltip from "@material-ui/core/Tooltip";
import ArrowDropDownIcon from "@material-ui/icons/ArrowDropDown";

type ButtonGroupProps = {};

const ButtonGroup = ({}: ButtonGroupProps) => {
  const dispatch = useDispatch();

  const selectionMethod = useSelector(selectionMethodSelector);

  const onChange = (
    event: React.MouseEvent<HTMLElement>,
    selectionMethod: SelectionMethod
  ) => {
    const payload = {
      selectionMethod: selectionMethod,
    };

    dispatch(applicationSlice.actions.updateSelectionMethod(payload));
  };

  return (
    <ToggleButtonGroup
      exclusive
      onChange={onChange}
      size="small"
      value={selectionMethod}
    >
      <Tooltip title={SelectionMethod.Quick}>
        <ToggleButton value={SelectionMethod.Quick}>
          <BrushIcon />
        </ToggleButton>
      </Tooltip>

      <Tooltip title={SelectionMethod.RectangularMarquee}>
        <ToggleButton value={SelectionMethod.RectangularMarquee}>
          <Crop32Icon />
          <ArrowDropDownIcon />
        </ToggleButton>
      </Tooltip>

      <Tooltip title={SelectionMethod.Lasso}>
        <ToggleButton value={SelectionMethod.Lasso}>
          <Crop32Icon />
          <ArrowDropDownIcon />
        </ToggleButton>
      </Tooltip>
    </ToggleButtonGroup>
  );
};

type ImageDialogAppBarProps = {
  onClose: () => void;
};

export const ImageDialogAppBar = ({ onClose }: ImageDialogAppBarProps) => {
  const classes = useStyles();

  const dispatch = useDispatch();

  const selectionMethod = useSelector(selectionMethodSelector);

  const onChange = (
    event: React.MouseEvent<HTMLElement>,
    selectionMethod: SelectionMethod
  ) => {
    const payload = {
      selectionMethod: selectionMethod,
    };

    dispatch(applicationSlice.actions.updateSelectionMethod(payload));
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

        <ButtonGroup />

        <div className={classes.grow} />

        <IconButton color="inherit" onClick={() => {}}>
          <OpenWithIcon />
        </IconButton>

        <Button />
      </Toolbar>
    </AppBar>
  );
};
