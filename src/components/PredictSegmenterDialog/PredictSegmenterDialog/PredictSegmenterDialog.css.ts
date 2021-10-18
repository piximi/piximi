import { makeStyles } from "@mui/material";

const drawerWidth = 280;

export const useStyles = makeStyles((theme) => ({
  container: {
    paddingBottom: theme.spacing(8),
    paddingTop: theme.spacing(8),
  },
  content: {
    flexGrow: 1,
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
  gridList: {
    transform: "translateZ(0)",
  },
  imageTile: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    top: 0,
    transform: "none",
  },
  paper: {
    zIndex: 1203,
  },
}));
