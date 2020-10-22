import AppBar from "@material-ui/core/AppBar";
import clsx from "clsx";
import Toolbar from "@material-ui/core/Toolbar";
import IconButton from "@material-ui/core/IconButton";
import MenuIcon from "@material-ui/icons/Menu";
import Typography from "@material-ui/core/Typography";
import React from "react";
import { useStyles } from "./ApplicationAppBar.css";
import { Button } from "@material-ui/core";
import CloudUploadIcon from "@material-ui/icons/CloudUpload";
import SearchIcon from "@material-ui/icons/Search";
import InputBase from "@material-ui/core/InputBase";

type ApplicationAppBar = {
  onOpenDrawer: () => void;
  openDrawer: boolean;
};

export const ApplicationAppBar = ({
  onOpenDrawer,
  openDrawer,
}: ApplicationAppBar) => {
  const classes = useStyles();

  return (
    <div className={classes.grow}>
      <AppBar
        className={clsx(classes.appBar, { [classes.appBarShift]: openDrawer })}
        color="transparent"
        position="fixed"
      >
        <Toolbar>
          <IconButton color="inherit" onClick={onOpenDrawer} edge="start">
            <MenuIcon />
          </IconButton>

          <Typography
            className={classes.title}
            color="inherit"
            noWrap
            variant="h6"
          >
            Piximi
          </Typography>

          <div className={classes.grow} />

          <div className={classes.search}>
            <div className={classes.searchIcon}>
              <SearchIcon />
            </div>
            <InputBase
              disabled={true}
              placeholder="Search…"
              classes={{
                root: classes.inputRoot,
                input: classes.inputInput,
              }}
              inputProps={{ "aria-label": "search" }}
            />
          </div>

          <Button className={classes.button} startIcon={<CloudUploadIcon />}>
            Open images
          </Button>
        </Toolbar>
      </AppBar>
    </div>
  );
};
