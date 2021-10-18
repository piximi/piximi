import { makeStyles } from "@mui/styles";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { Theme } from "@mui/material";

export const useStyles = makeStyles((theme: Theme) => ({
  grow: {
    flexGrow: 1,
  },
  imageDialogToolboxBar: {
    flexGrow: 1,
    paddingBottom: "50px;",
  },
}));
