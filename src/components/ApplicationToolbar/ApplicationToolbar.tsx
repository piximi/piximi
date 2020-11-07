import Toolbar from "@material-ui/core/Toolbar";
import IconButton from "@material-ui/core/IconButton";
import MenuIcon from "@material-ui/icons/Menu";
import React from "react";
import { useStyles } from "./ApplicationToolbar.css";
import { UploadButton } from "../UploadButton";
import { Logo } from "../Logo";
import { SearchInput } from "../SearchInput";
import { Slider } from "@material-ui/core";
import { projectSlice } from "../../store/slices";
import { useDispatch } from "react-redux";
import ZoomInIcon from "@material-ui/icons/ZoomIn";
import ZoomOutIcon from "@material-ui/icons/ZoomOut";

type ApplicationToolbarProps = {
  toggle: () => void;
};

export const ApplicationToolbar = ({ toggle }: ApplicationToolbarProps) => {
  const classes = useStyles();

  const dispatch = useDispatch();

  const [value, setValue] = React.useState<number>(1);

  const handleChange = (event: any, newValue: any) => {
    setValue(newValue);
    dispatch(
      projectSlice.actions.updateTileSize({
        newValue: newValue,
      })
    );
  };

  return (
    <Toolbar>
      <IconButton color="inherit" onClick={toggle} edge="start">
        <MenuIcon />
      </IconButton>

      <Logo />

      <div className={classes.grow} />

      <ZoomOutIcon />
      <Slider
        value={value}
        min={0.6}
        max={4}
        step={0.01}
        onChange={handleChange}
        style={{ width: "15%" }}
      />
      <ZoomInIcon />

      <SearchInput />

      <UploadButton />
    </Toolbar>
  );
};
