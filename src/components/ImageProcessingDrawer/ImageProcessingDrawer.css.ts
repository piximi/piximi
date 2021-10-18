import { makeStyles } from "@mui/styles";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { Theme } from "@mui/material";

export const useStyles = makeStyles((theme: Theme) => ({
  drawer: {
    flexShrink: 0,
    width: theme.spacing(32),
  },
  drawerHeader: {
    ...theme.mixins.toolbar,
    alignItems: "center",
    display: "flex",
    paddingLeft: theme.spacing(3),
  },
  drawerPaper: {
    width: theme.spacing(32),
    zIndex: 0,
  },
  slider: {
    padding: theme.spacing(3),
  },
  sliderInput: {
    width: 42,
  },
}));
