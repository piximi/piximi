import CssBaseline from "@material-ui/core/CssBaseline";

import React, { useEffect } from "react";
import ReactDOM from "react-dom";

import * as serviceWorker from "./serviceWorker";
import { Provider } from "react-redux";
import { ApplicationDrawer, ApplicationAppBar, ImageGrid } from "./components";
import { productionStore } from "./store/stores";
import { classifierSlice } from "./store/slices";
import { useDispatch } from "react-redux";

const Application = () => {
  const dispatch = useDispatch();

  const [openDrawer, setOpenDrawer] = React.useState(true);

  const onOpenDrawer = () => {
    setOpenDrawer(true);
  };

  const onCloseDrawer = () => {
    setOpenDrawer(false);
  };

  useEffect(() => {
    const pathname =
      "https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json";

    dispatch(
      classifierSlice.actions.open({
        pathname: pathname,
        classes: 10,
        units: 100,
      })
    );
  });

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
