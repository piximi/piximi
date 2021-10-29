import makeStyles from "@mui/styles/makeStyles";
import { Theme } from "@mui/material";

export const useStyles = makeStyles((theme: Theme) => ({
  form: {
    maginLeft: "15px",
  },
  content: {
    marginTop: theme.spacing(2),
  },
  boxLayout: {
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
    margin: "20px",
  },
  typography: {
    fontWeight: "inherit",
    marginRight: "15px",
    width: "100px",
    textAlign: "right",
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  title: {
    flexGrow: 1,
  },
  appBar: {
    flexGrow: 1,
  },
  toolbar: {
    ...theme.mixins.toolbar,
  },
}));
