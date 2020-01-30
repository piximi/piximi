import {createMuiTheme} from "@material-ui/core";
import {ThemeProvider} from "@material-ui/styles";
import {store} from "@piximi/store";
import {storiesOf} from "@storybook/react";
import * as React from "react";
import {Provider} from "react-redux";

import {CompileButton} from "./CompileButton";

const theme = createMuiTheme({
  palette: {
    type: "light"
  }
});

storiesOf("CompileButton", module).add("example", () => {
  const next = () => {};

  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CompileButton next={next} />
      </ThemeProvider>
    </Provider>
  );
});
