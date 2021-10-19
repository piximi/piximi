import React from "react";
import ReactDOM from "react-dom";
import * as serviceWorker from "./serviceWorker";
import { Provider } from "react-redux";
import { productionStore } from "./store/stores";
import { Application } from "./components/Application";
import { ThemeProvider } from "@mui/styles";
import { createTheme } from "@mui/material/styles";

const theme = createTheme();

ReactDOM.render(
  <Provider store={productionStore}>
    {/*// @ts-ignore */}
    <ThemeProvider theme={theme}>
      <Application />
    </ThemeProvider>
  </Provider>,
  document.getElementById("root")
);

serviceWorker.register();
