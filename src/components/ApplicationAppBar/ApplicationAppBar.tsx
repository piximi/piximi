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
import { UploadMenu } from "../UploadMenu";
import Tooltip from "@material-ui/core/Tooltip";

type ApplicationAppBar = {
  onOpenDrawer: () => void;
  openDrawer: boolean;
};

export const ApplicationAppBar = ({
  onOpenDrawer,
  openDrawer,
}: ApplicationAppBar) => {
  const [
    uploadMenuAnchorEl,
    setUploadMenuAnchorEl,
  ] = React.useState<HTMLElement | null>();

  const onOpenUploadMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setUploadMenuAnchorEl(event.currentTarget);
  };

  const onCloseonOpenUploadMenu = () => {
    setUploadMenuAnchorEl(null);
  };

  const classes = useStyles();

  return (
    <React.Fragment>
      <div className={classes.grow}>
        <AppBar
          className={clsx(classes.appBar, {
            [classes.appBarShift]: openDrawer,
          })}
          color="inherit"
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

            <Tooltip title="Upload images">
              <Button
                className={classes.button}
                onClick={onOpenUploadMenu}
                startIcon={<CloudUploadIcon />}
              >
                Upload
              </Button>
            </Tooltip>
          </Toolbar>
        </AppBar>
      </div>

      <UploadMenu
        anchorEl={uploadMenuAnchorEl!}
        onClose={onCloseonOpenUploadMenu}
      />
    </React.Fragment>
  );
};
