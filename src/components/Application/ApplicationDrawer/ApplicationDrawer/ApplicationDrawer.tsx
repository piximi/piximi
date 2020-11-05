import IconButton from "@material-ui/core/IconButton";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import Divider from "@material-ui/core/Divider";
import { FileList } from "../FileList/FileList";
import { CategoriesList } from "../CategoriesList/CategoriesList";
import { ClassifierList } from "../ClassifierList/ClassifierList";
import { ApplicationList } from "../ApplicationList/ApplicationList";
import Drawer from "@material-ui/core/Drawer";
import React from "react";
import { useStyles } from "../../Application/Application.css";
import useTheme from "@material-ui/core/styles/useTheme";

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
        <IconButton onClick={onCloseDrawer}>
          {theme.direction === "ltr" ? (
            <ChevronLeftIcon />
          ) : (
            <ChevronRightIcon />
          )}
        </IconButton>
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
