import React from "react";
import ReactDOM from "react-dom";
import * as serviceWorker from "./serviceWorker";
import { Provider } from "react-redux";
import { productionStore } from "./store/stores";
import { Application } from "./components/Application";

ReactDOM.render(
  <Provider store={productionStore}>
    <Application />
  </Provider>,
  document.getElementById("root")
);

serviceWorker.register();
