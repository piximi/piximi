import { render } from "react-dom";
import { DndProvider } from "react-dnd";
import { Provider } from "react-redux";
import { HTML5Backend } from "react-dnd-html5-backend";

import { productionStore } from "store";

import { Application } from "./Application";

render(
  <Provider store={productionStore}>
    <DndProvider backend={HTML5Backend}>
      <Application />
    </DndProvider>
  </Provider>,
  document.getElementById("root"),
);
