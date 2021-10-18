import { makeStyles } from "@mui/styles";
import { createTheme, ThemeProvider } from "@mui/material/styles";

const theme = createTheme();

export const useStyles = makeStyles((theme) => ({
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
