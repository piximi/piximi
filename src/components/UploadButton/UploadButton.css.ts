import { makeStyles } from "@mui/styles";
import { createTheme, ThemeProvider } from "@mui/material/styles";

const theme = createTheme();

export const useStyles = makeStyles((theme: any) => ({
  button: {
    margin: theme.spacing(1),
    textTransform: "none",
  },
}));
