import * as React from "react";
import {storiesOf} from "@storybook/react";
import {FitClassifierDialog} from "./FitClassifierDialog";
import {ThemeProvider} from "@material-ui/styles";
import {createMuiTheme} from "@material-ui/core";
import {useDialog} from "@piximi/hooks";
import {Provider} from "react-redux";
import {store} from "@piximi/store";

const theme = createMuiTheme({
  palette: {
    type: "light"
  }
});

storiesOf("FitClassifierDialog", module).add("example", () => {
  const {closeDialog} = useDialog();

  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <FitClassifierDialog closeDialog={closeDialog} openedDialog />
      </ThemeProvider>
    </Provider>
  );
});
