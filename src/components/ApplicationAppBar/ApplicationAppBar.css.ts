import { makeStyles } from "@mui/styles";
import { createTheme, ThemeProvider } from "@mui/material/styles";

const theme = createTheme();

export const useStyles = makeStyles((theme) => ({
  appBar: {
    borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
    boxShadow: "none",
  },
  grow: {
    flexGrow: 1,
  },
}));
