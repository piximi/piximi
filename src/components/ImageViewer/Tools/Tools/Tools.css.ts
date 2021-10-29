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
    width: operationsWidth,
  },
  toolbar: {
    alignItems: "center",
    display: "flex",
    justifyContent: "flex-end",
    padding: theme.spacing(0, 1),
    ...theme.mixins.toolbar,
  },
  child: {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
  },
}));
