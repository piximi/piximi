import AppBar from "@material-ui/core/AppBar";
import CssBaseline from "@material-ui/core/CssBaseline";
import IconButton from "@material-ui/core/IconButton";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import MenuIcon from "@material-ui/icons/Menu";

import React from "react";
import ReactDOM from "react-dom";

import * as serviceWorker from "./serviceWorker";
import { useStyles } from "./index.css";
import clsx from "clsx";
import { Provider } from "react-redux";
import { store } from "./store";
import { ImageGrid } from "./ImageGrid";
import { ApplicationDrawer } from "./ApplicationDrawer";

const Application = () => {
  /*
   * Drawer
   */
  const [openDrawer, setOpenDrawer] = React.useState(true);

  const onOpenDrawer = () => {
    setOpenDrawer(true);
  };

  const onCloseDrawer = () => {
    setOpenDrawer(false);
  };

  const classes = useStyles();

  return (
    <React.Fragment>
      <CssBaseline />

      <AppBar
        className={clsx(classes.appBar, { [classes.appBarShift]: openDrawer })}
        position="fixed"
      >
        <Toolbar>
          <IconButton color="inherit" onClick={onOpenDrawer} edge="start">
            <MenuIcon />
          </IconButton>

          <Typography color="inherit" noWrap variant="h6">
            Piximi
          </Typography>
        </Toolbar>
      </AppBar>

      <ApplicationDrawer onClose={onCloseDrawer} openDrawer={openDrawer} />

      <ImageGrid openDrawer={openDrawer} />
    </React.Fragment>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <Application />
    </Provider>
  </React.StrictMode>,
  document.getElementById("root")
);

serviceWorker.register();
