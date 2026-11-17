import { DndProvider } from "react-dnd";
import { Provider } from "react-redux";
import { HTML5Backend } from "react-dnd-html5-backend";

import { createRoot } from "react-dom/client";

import { BackendProvider, installBackend } from "core/backend";

import { productionStore } from "store";

import { Application } from "./app/Application";

const domNode = document.getElementById("root");
const root = createRoot(domNode!);

// A remote session has to connect and fill the store before the first paint.
void installBackend(productionStore).then((backend) => {
  root.render(
    <Provider store={productionStore}>
      <BackendProvider backend={backend}>
        <DndProvider backend={HTML5Backend}>
          <Application />
        </DndProvider>
      </BackendProvider>
    </Provider>,
  );
});
