import IconButton from "@material-ui/core/IconButton";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import Divider from "@material-ui/core/Divider";
import { FileList } from "../FileList";
import { CategoriesList } from "../CategoriesList";
import { ClassifierList } from "../ClassifierList";
import { ApplicationList } from "../ApplicationList";
import Drawer from "@material-ui/core/Drawer";
import React from "react";
import { useStyles } from "../Application/Application.css";
import useTheme from "@material-ui/core/styles/useTheme";
import Toolbar from "@material-ui/core/Toolbar";
import { Logo } from "../Logo";
import MenuIcon from "@material-ui/icons/Menu";

type ApplicationDrawerProps = {
  onCloseDrawer: () => void;
  openDrawer: boolean;
};

export const ApplicationDrawer = ({
  onCloseDrawer,
  openDrawer,
}: ApplicationDrawerProps) => {
  const classes = useStyles();

  const theme = useTheme();

  return (
    <Drawer
      anchor="left"
      className={classes.drawer}
      classes={{ paper: classes.drawerPaper }}
      open={openDrawer}
      variant="persistent"
    >
      <div className={classes.drawerHeader}>
        {openDrawer && (
          <React.Fragment>
            <IconButton color="inherit" onClick={onCloseDrawer} edge="start">
              <MenuIcon />
            </IconButton>

            <Logo />
          </React.Fragment>
        )}
      </div>

      <Divider />

      <FileList />

      <Divider />

      <CategoriesList />

      <Divider />

      <ClassifierList />

      <Divider />

      <ApplicationList />
    </Drawer>
  );
};
