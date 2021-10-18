import { makeStyles } from "@mui/styles";
import { createTheme, ThemeProvider } from "@mui/material/styles";

const theme = createTheme();

export const useStyles = makeStyles((theme: any) => ({
  appBar: {
    transition: theme.transitions.create(["margin", "width"], {
      duration: theme.transitions.duration.leavingScreen,
      easing: theme.transitions.easing.sharp,
    }),
  },
  closeButton: {
    marginRight: theme.spacing(2),
  },
  count: {
    flexGrow: 1,
  },
}));
