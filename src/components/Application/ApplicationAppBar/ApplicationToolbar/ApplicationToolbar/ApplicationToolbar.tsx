import Toolbar from "@material-ui/core/Toolbar";
import IconButton from "@material-ui/core/IconButton";
import MenuIcon from "@material-ui/icons/Menu";
import React from "react";
import { useStyles } from "./ApplicationToolbar.css";
import { UploadButton } from "../UploadButton/UploadButton";
import { Logo } from "../Logo";
import { SearchInput } from "../SearchInput";

type ApplicationToolbarProps = {
  toggle: () => void;
};

export const ApplicationToolbar = ({ toggle }: ApplicationToolbarProps) => {
  const classes = useStyles();

  return (
    <Toolbar>
      <IconButton color="inherit" onClick={toggle} edge="start">
        <MenuIcon />
      </IconButton>

      <Logo />

      <div className={classes.grow} />

      <SearchInput />

      <UploadButton />
    </Toolbar>
  );
};
