import React from "react";
import ReactDOM from "react-dom";
import { createRoot } from "react-dom/client";

import { DndProvider } from "react-dnd";
import { Provider } from "react-redux";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Application } from "./Application";
import { productionStore } from "store";

const container = document.getElementById("root");
const root = createRoot(container!); // createRoot(container!) if you use TypeScript
root.render(
  <Provider store={productionStore}>
    <DndProvider backend={HTML5Backend}>
      <Application />
    </DndProvider>
  </Provider>,
);
