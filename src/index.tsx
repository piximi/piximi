import React from "react";
import ReactDOM from "react-dom";
// import * as serviceWorker from "./serviceWorker";
import { Provider } from "react-redux";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Application } from "./components/Application";
import { productionStore } from "./store";
import ReactGA from "react-ga4";

ReactGA.initialize("G-5P5KZ3V7GL");

ReactDOM.render(
  <Provider store={productionStore}>
    <DndProvider backend={HTML5Backend}>
      <Application />
    </DndProvider>
  </Provider>,
  document.getElementById("root")
);

// serviceWorker.register();
