import { DndProvider } from "react-dnd";
import { Provider } from "react-redux";
import { HTML5Backend } from "react-dnd-html5-backend";

import { createRoot } from "react-dom/client";

import { productionStore } from "store";

import { Application } from "./app/Application";

const domNode = document.getElementById("root");
const root = createRoot(domNode!);

root.render(
  <Provider store={productionStore}>
    <DndProvider backend={HTML5Backend}>
      <Application />
    </DndProvider>
  </Provider>,
);
