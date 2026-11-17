import { DndProvider } from "react-dnd";
import { Provider } from "react-redux";
import { HTML5Backend } from "react-dnd-html5-backend";

import { createRoot } from "react-dom/client";

import { BackendProvider } from "core/backend";

import { productionStore } from "store";

import { Application } from "./app/Application";
import { BackendBoot } from "./app/BackendBoot";

const domNode = document.getElementById("root");
const root = createRoot(domNode!);

root.render(
  <Provider store={productionStore}>
    <BackendBoot store={productionStore}>
      {(backend) => (
        <BackendProvider backend={backend}>
          <DndProvider backend={HTML5Backend}>
            <Application />
          </DndProvider>
        </BackendProvider>
      )}
    </BackendBoot>
  </Provider>,
);
