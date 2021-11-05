import { makeStyles } from "@mui/styles";
import { Theme } from "@mui/material";

const operationsWidth = 56;

export const useStyles = makeStyles((theme: Theme) => ({
  card: {
    width: 210,
  },
  cardContent: {
    width: "200px",
  },
  cardHeader: {
    position: "absolute",
    width: "100%",
  },
  cardMedia: {
    height: 230,
  },
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
  tooltip: {
    maxWidth: "none",
  },
}));
