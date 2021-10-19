import { makeStyles } from "@mui/styles";
import { createTheme, ThemeProvider } from "@mui/material/styles";

import { Theme } from "@mui/material";

export const useStyles = makeStyles((theme: Theme) => ({
  stage: {
    position: "relative",
  },
  userEventsCanvas: {
    position: "absolute",
    zIndex: 3,
  },
  masksCanvas: {
    position: "absolute",
    zIndex: 2,
  },
  backgroundCanvas: {
    position: "absolute",
    zIndex: 1,
  },
}));
