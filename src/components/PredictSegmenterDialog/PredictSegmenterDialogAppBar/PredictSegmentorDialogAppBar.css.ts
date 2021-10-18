import { makeStyles } from "@mui/styles";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { Theme } from "@mui/material";

export const useStyles = makeStyles((theme: Theme) => ({
  leftIcon: {
    marginRight: theme.spacing(1),
  },
  button: {},
  grow: {
    flexGrow: 1,
  },
  appBar: {
    position: "relative",
    backgroundColor: "transparent",
    boxShadow: "none",
    borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
  },
  appBarShift: {},
  appBarShiftLeft: {},
}));
