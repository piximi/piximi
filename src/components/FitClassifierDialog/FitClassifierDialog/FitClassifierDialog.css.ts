import { makeStyles } from "@mui/styles";

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
  container: {
    width: "100%",
    display: "flex",
    flexWrap: "wrap",
  },
  menu: {
    // width: 200,
  },
  textField: {
    // marginLeft: theme.spacing(1),
    marginRight: theme.spacing(1),
    flexBasis: 300,
    marginTop: theme.spacing(2.75),
    width: "100%",
  },
  select: {
    marginRight: theme.spacing(1),
    flexBasis: 300,
    marginTop: theme.spacing(0),
    width: "100%",
  },
}));
