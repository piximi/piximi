import {createMuiTheme} from "@material-ui/core";
import {ThemeProvider} from "@material-ui/styles";
import {reducer} from "@piximi/store";
import {storiesOf} from "@storybook/react";
import * as React from "react";
import {Provider} from "react-redux";
import {createStore} from "redux";

import {CompileOptionsForm} from "./CompileOptionsForm";

const store = createStore(reducer);

const theme = createMuiTheme({
  palette: {
    type: "light"
  }
});

storiesOf("CompileOptionsForm", module).add("example", () => {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CompileOptionsForm />
      </ThemeProvider>
    </Provider>
  );
});
