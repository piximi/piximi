import React from "react";
import ReactDOM from "react-dom";
import * as serviceWorker from "./serviceWorker";
import { Provider } from "react-redux";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Application } from "./components/Application";
import { productionStore } from "store/stores";

ReactDOM.render(
  <Provider store={productionStore}>
    <DndProvider backend={HTML5Backend}>
      <Application />
    </DndProvider>
  </Provider>,
  document.getElementById("root")
);

serviceWorker.register();
