import { makeStyles } from "@mui/styles";
import { Theme } from "@mui/material";

export const useStyles = makeStyles((theme: Theme) => ({
  appBar: {
    borderBottom: "1px solid #3F3F3F",
    backgroundColor: "red",
    boxShadow: "none",
    left: theme.spacing(32),
    position: "absolute",
    opacity: "50%",
  },
  content: {
    backgroundColor: theme.palette.background.default,
    width: "100%",
    marginTop: theme.spacing(2),
  },
  toolbar: {
    ...theme.mixins.toolbar,
  },
  parent: {
    cursor: "crosshair",
    width: "100%",
  },
}));
