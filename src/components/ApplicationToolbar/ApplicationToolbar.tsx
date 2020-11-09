import Toolbar from "@material-ui/core/Toolbar";
import IconButton from "@material-ui/core/IconButton";
import MenuIcon from "@material-ui/icons/Menu";
import React from "react";
import { useStyles } from "./ApplicationToolbar.css";
import { UploadButton } from "../UploadButton";
import { Logo } from "../Logo";
import { SearchInput } from "../SearchInput";
import { Slider } from "@material-ui/core";
import { settingsSlice } from "../../store/slices";
import { useDispatch } from "react-redux";
import ZoomInIcon from "@material-ui/icons/ZoomIn";
import ZoomOutIcon from "@material-ui/icons/ZoomOut";

type ApplicationToolbarProps = {
  toggle: () => void;
  open: boolean;
};

export const ApplicationToolbar = ({
  toggle,
  open,
}: ApplicationToolbarProps) => {
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
      settingsSlice.actions.updateTileSize({
        newValue: newValue as number,
      })
    );
  };

  return (
    <Toolbar>
      {!open && (
        <React.Fragment>
          <IconButton color="inherit" onClick={toggle} edge="start">
            <MenuIcon />
          </IconButton>

          <Logo />
        </React.Fragment>
      )}

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
