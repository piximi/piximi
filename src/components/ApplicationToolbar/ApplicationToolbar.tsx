import Toolbar from "@material-ui/core/Toolbar";
import React from "react";
import { useStyles } from "./ApplicationToolbar.css";
import { UploadButton } from "../UploadButton";
import { Logo } from "../Logo";
import { SearchInput } from "../SearchInput";
import { Slider } from "@material-ui/core";
import { applicationSlice } from "../../store/slices";
import { useDispatch } from "react-redux";
import ZoomInIcon from "@material-ui/icons/ZoomIn";
import ZoomOutIcon from "@material-ui/icons/ZoomOut";

export const ApplicationToolbar = () => {
  const classes = useStyles();

  const dispatch = useDispatch();

  const [value, setValue] = React.useState<number>(1);

  const onChange = (
    event: React.ChangeEvent<{}>,
    newValue: number | number[]
  ) => {
    setValue(newValue as number);
  };

  const onChangeCommitted = (
    event: React.ChangeEvent<{}>,
    newValue: number | number[]
  ) => {
    dispatch(
      applicationSlice.actions.updateTileSize({
        newValue: newValue as number,
      })
    );
  };

  return (
    <Toolbar>
      <Logo />

      <div className={classes.grow} />

      <ZoomOutIcon className={classes.zoomIcon} />

      <Slider
        value={value}
        min={0.6}
        max={4}
        step={0.01}
        onChange={onChange}
        onChangeCommitted={onChangeCommitted}
        className={classes.zoomSlider}
      />
      <ZoomInIcon className={classes.zoomIcon} />

      <SearchInput />

      <UploadButton />
    </Toolbar>
  );
};
