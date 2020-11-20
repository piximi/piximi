import { makeStyles } from "@material-ui/core/styles";

export const useStyles = makeStyles((theme) => ({
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
