import React from "react";
import ReactDOM from "react-dom";
import * as serviceWorker from "./serviceWorker";
import { Provider } from "react-redux";
import { productionStore } from "./store/stores";
import { Application } from "./components/Application";
import { ThemeProvider } from "@mui/styles";
import { createTheme } from "@mui/material/styles";
import { StyledEngineProvider } from "@mui/material/styles";
import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";

const theme = createTheme();

ReactDOM.render(
  <Provider store={productionStore}>
    {/*// @ts-ignore */}
    <ThemeProvider theme={theme}>
      <StyledEngineProvider injectFirst>
        {/*// @ts-ignore */}
        <DndProvider backend={HTML5Backend}>
          <Application />
        </DndProvider>
      </StyledEngineProvider>
    </ThemeProvider>
  </Provider>,
  document.getElementById("root")
);

serviceWorker.register();
