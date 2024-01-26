import React from "react";
import ReactDOM from "react-dom";
// import * as serviceWorker from "./serviceWorker";

import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Application } from "views/Application";
import { AsyncProvider } from "store/AsyncProvider";

ReactDOM.render(
  <AsyncProvider>
    <DndProvider backend={HTML5Backend}>
      <Application />
    </DndProvider>
  </AsyncProvider>,
  document.getElementById("root")
);

// serviceWorker.register();
