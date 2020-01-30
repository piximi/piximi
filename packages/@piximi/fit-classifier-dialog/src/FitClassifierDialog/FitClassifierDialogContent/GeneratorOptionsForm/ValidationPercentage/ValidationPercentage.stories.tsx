import * as React from "react";
import {storiesOf} from "@storybook/react";
import {ValidationPercentage} from "./ValidationPercentage";
import {ThemeProvider} from "@material-ui/styles";
import {createMuiTheme} from "@material-ui/core";
import {Provider} from "react-redux";
import {reducer} from "@piximi/store";
import {createStore} from "redux";
import Grid from "@material-ui/core/Grid";

const store = createStore(reducer);

const theme = createMuiTheme({
  palette: {
    type: "light"
  }
});

storiesOf("ValidationPercentage", module).add("example", () => {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <Grid container>
          <Grid item xs={6}>
            <ValidationPercentage />
          </Grid>
        </Grid>
      </ThemeProvider>
    </Provider>
  );
});
