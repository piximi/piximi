import { makeStyles } from "@mui/styles";
import { createTheme, ThemeProvider } from "@mui/material/styles";

const theme = createTheme();
export const useStyles = makeStyles((theme: any) => ({
  grow: {
    flexGrow: 1,
  },
  imageDialogToolboxBar: {
    flexGrow: 1,
    paddingBottom: "50px;",
  },
}));
