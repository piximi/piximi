import React from "react";
import { UploadButton } from "../UploadButton";
import { Logo } from "../Logo";
import { applicationSlice } from "../../store/slices";
import { useDispatch } from "react-redux";
import { useStyles } from "./ApplicationToolbar.css";
import { Slider, Toolbar } from "@mui/material";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import ZoomInIcon from "@mui/icons-material/ZoomIn";

export const ApplicationToolbar = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const [value, setValue] = React.useState<number>(1);
  const onChange = (event: Event, newValue: number | number[]) => {
    setValue(newValue as number);
    dispatch(
      applicationSlice.actions.updateTileSize({
        newValue: newValue as number,
      })
    );
  };
  // const onChangeCommitted = (
  //   event: React.ChangeEvent<{}>,
  //   newValue: number | number[]
  // ) => {
  //   dispatch(
  //     applicationSlice.actions.updateTileSize({
  //       newValue: newValue as number,
  //     })
  //   );
  // };
  return (
    <Toolbar>
      <Logo />
      {/*<TaskSelect />*/}
      <div className={classes.grow} />
      <ZoomOutIcon className={classes.zoomIcon} />
      <Slider
        value={value}
        min={0.6}
        max={4}
        step={0.1}
        onChange={onChange}
        className={classes.zoomSlider}
      />
      <ZoomInIcon className={classes.zoomIcon} />
      {/*<SearchInput />*/}
      <UploadButton />
    </Toolbar>
  );
};
