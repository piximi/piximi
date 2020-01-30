import {createStyles} from "@material-ui/core/styles";
import {Theme} from "@material-ui/core";

const drawerWidth = 280;

export const styles = (theme: Theme) =>
  createStyles({
    root: {
      flexGrow: 1
    },
    appFrame: {
      zIndex: 1,
      overflow: "hidden",
      display: "flex",
      width: "100%"
    },
    appBar: {
      position: "absolute",
      transition: theme.transitions.create(["margin", "width"], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen
      })
    },
    appBarShift: {
      transition: theme.transitions.create(["margin", "width"], {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen
      })
    },
    appBarShiftLeft: {
      marginLeft: drawerWidth
    },
    menuButton: {
      marginLeft: 12,
      marginRight: 20
    },
    hide: {
      display: "none"
    },
    drawerPaper: {
      position: "relative",
      width: drawerWidth
    },
    drawerHeader: {
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-end",
      toolbar: theme.mixins.toolbar
    },
    content: {
      flexGrow: 1,
      transition: theme.transitions.create("margin", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen
      })
    },
    contentLeft: {
      marginLeft: 0
    },
    contentShift: {
      transition: theme.transitions.create("margin", {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen
      })
    },
    contentShiftLeft: {
      marginLeft: drawerWidth
    },
    fab: {
      position: "absolute",
      bottom: theme.spacing(2),
      right: theme.spacing(2)
    },
    unlabeledToggled: {
      "&:hover": {
        background: "rgba(150,150,150,1)"
      },
      background: "rgba(200,200,200,1)",
      position: "absolute",
      bottom: theme.spacing(2),
      right: theme.spacing(2)
    },
    unlabeledUntoggled: {
      background: "rgba(200,50,50,1)",
      position: "absolute",
      bottom: theme.spacing(2),
      right: theme.spacing(2)
    },
    pacmanLoader: {
      position: "fixed",
      top: "50%",
      left: "50%"
    }
  });
