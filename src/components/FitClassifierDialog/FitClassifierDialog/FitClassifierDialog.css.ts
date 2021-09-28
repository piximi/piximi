import { createStyles } from "@material-ui/styles";
import { Theme } from "@material-ui/core";

const drawerWidth = 280;

export const styles = (theme: Theme) =>
  createStyles({
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
  });
