import { makeStyles } from "@mui/styles";
import { Theme } from "@mui/material";

export const useStyles = makeStyles((theme: Theme) => ({
  icons: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
  },
}));
