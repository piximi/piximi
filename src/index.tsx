import React from "react";
import ReactDOM from "react-dom";
// import * as serviceWorker from "./serviceWorker";

import { DndProvider } from "react-dnd";
import { Provider } from "react-redux";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Application } from "./Application";
import { productionStore } from "store";

ReactDOM.render(
  <Provider store={productionStore}>
    <DndProvider backend={HTML5Backend}>
      <Application />
    </DndProvider>
  </Provider>,
  document.getElementById("root")
);

// serviceWorker.register();
