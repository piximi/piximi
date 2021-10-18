import { makeStyles } from "@mui/styles";
import { createTheme, ThemeProvider } from "@mui/material/styles";

import { Theme } from "@mui/material";
const drawerWidth = 280;

export const useStyles = makeStyles((theme: Theme) => ({
  content: {
    flexGrow: 0,
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  contentLeft: {
    marginLeft: 0,
  },
  contentShift: {
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  contentShiftLeft: {
    marginLeft: drawerWidth,
  },
  paper: {
    zIndex: 900,
  },
}));
