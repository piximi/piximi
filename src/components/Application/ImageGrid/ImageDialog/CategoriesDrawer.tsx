import Drawer from "@material-ui/core/Drawer";
import Divider from "@material-ui/core/Divider";
import React from "react";
import { useStyles } from "../../Application/Application.css";
import { CategoriesList } from "../../ApplicationDrawer/CategoriesList/CategoriesList";

export const CategoriesDrawer = () => {
  const classes = useStyles();

  return (
    <Drawer
      anchor="left"
      className={classes.drawer}
      classes={{ paper: classes.drawerPaper }}
      variant="permanent"
    >
      <div className={classes.drawerHeader} />

      <Divider />

      <CategoriesList />
    </Drawer>
  );
};
