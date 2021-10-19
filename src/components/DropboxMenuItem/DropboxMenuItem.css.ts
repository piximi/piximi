import { makeStyles } from "@mui/styles";
import { createTheme, ThemeProvider } from "@mui/material/styles";

import { Theme } from "@mui/material";
export const useStyles = makeStyles((theme: Theme) => ({
  item: {
    maxWidth: 320,
  },
  subheader: {
    color: "#80868b",
    margin: "16px",
    letterSpacing: ".07272727em",
    fontSize: ".6875rem",
    fontWeight: 500,
    lineHeight: "1rem",
    textTransform: "uppercase",
    maxWidth: 320,
  },
}));
