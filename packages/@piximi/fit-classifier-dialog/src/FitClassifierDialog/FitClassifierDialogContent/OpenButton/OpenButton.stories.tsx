import {createMuiTheme} from "@material-ui/core";
import {ThemeProvider} from "@material-ui/styles";
import {store} from "@piximi/store";
import {storiesOf} from "@storybook/react";
import * as React from "react";
import {Provider} from "react-redux";

import {OpenButton} from "./OpenButton";

const theme = createMuiTheme({
  palette: {
    type: "light"
  }
});

storiesOf("OpenButton", module).add("example", () => {
  const next = () => {};

  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <OpenButton next={next} />
      </ThemeProvider>
    </Provider>
  );
});
