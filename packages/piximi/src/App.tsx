import * as React from "react";
import {ConnectedGalleryDialog} from "@piximi/gallery-dialog";
import {createMuiTheme} from "@material-ui/core/styles";
import {ThemeProvider} from "@material-ui/styles";

const theme = createMuiTheme();

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <ConnectedGalleryDialog />
    </ThemeProvider>
  );
};

export default App;
