import { makeStyles } from "@mui/styles";
import { Theme } from "@mui/material";
const operationsWidth = 56;

export const useStyles = makeStyles((theme: Theme) => ({
  drawer: {
    flexShrink: 0,
    whiteSpace: "nowrap",
    width: operationsWidth,
  },
  paper: {
    zIndex: 0,
    width: operationsWidth,
  },
}));
