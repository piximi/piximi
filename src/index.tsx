import CssBaseline from "@material-ui/core/CssBaseline";

import React from "react";
import ReactDOM from "react-dom";

import * as serviceWorker from "./serviceWorker";
import { Provider } from "react-redux";
import { ImageGrid } from "./ImageGrid";
import { ApplicationDrawer } from "./ApplicationDrawer";
import { ApplicationAppBar } from "./ApplicationAppBar";
import { productionStore } from "./store/stores";

const Application = () => {
  const [openDrawer, setOpenDrawer] = React.useState(true);

  const onOpenDrawer = () => {
    setOpenDrawer(true);
  };

  const onCloseDrawer = () => {
    setOpenDrawer(false);
  };

  return (
    <React.Fragment>
      <CssBaseline />

      <ApplicationAppBar onOpenDrawer={onOpenDrawer} openDrawer={openDrawer} />

      <ApplicationDrawer
        onCloseDrawer={onCloseDrawer}
        openDrawer={openDrawer}
      />

      <ImageGrid openDrawer={openDrawer} />
    </React.Fragment>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <Provider store={productionStore}>
      <Application />
    </Provider>
  </React.StrictMode>,
  document.getElementById("root")
);

serviceWorker.register();
