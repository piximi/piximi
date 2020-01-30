import {createMuiTheme} from "@material-ui/core";
import {ThemeProvider} from "@material-ui/styles";
import {reducer} from "@piximi/store";
import {storiesOf} from "@storybook/react";
import * as React from "react";
import {Provider} from "react-redux";
import {createStore} from "redux";

import {FitClassifierDialogContentStepper} from "./FitClassifierDialogContentStepper";

const store = createStore(reducer);

const theme = createMuiTheme({
  palette: {
    type: "light"
  }
});

storiesOf("FitClassifierDialogContentStepper", module).add("example", () => {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <FitClassifierDialogContentStepper />
      </ThemeProvider>
    </Provider>
  );
});
