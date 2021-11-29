import { makeStyles } from "@mui/styles";
import { Theme } from "@mui/material";

const settingsWidth = 240;
const operationsWidth = 56;

export const useStyles = makeStyles((theme: Theme) => ({
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
  },
  root: {
    display: "flex",
  },
  content: {
    flexGrow: 1,
    backgroundColor: theme.palette.background.default,
    padding: theme.spacing(3),
    width: "100%",
  },
  options: {
    width: settingsWidth,
    flexShrink: 0,
  },
  settingsPaper: {
    width: settingsWidth,
    right: operationsWidth,
    boxShadow: "inset 0 0 16px #000000",
  },
  toolbar: {
    ...theme.mixins.toolbar,
  },
  settingsToolbar: {
    alignItems: "center",
    display: "flex",
    justifyContent: "flex-end",
    padding: theme.spacing(0, 1),
    ...theme.mixins.toolbar,
  },
  operations: {
    flexShrink: 0,
    whiteSpace: "nowrap",
    width: operationsWidth,
  },
  operationsPaper: {
    width: operationsWidth,
  },
  operationsToolbar: {
    alignItems: "center",
    display: "flex",
    justifyContent: "flex-end",
    padding: theme.spacing(0, 1),
    ...theme.mixins.toolbar,
  },
  logo: {
    flexGrow: 1,
  },
  applicationDrawer: {
    flexShrink: 0,
    width: theme.spacing(32),
  },
  applicationDrawerHeader: {
    ...theme.mixins.toolbar,
    alignItems: "center",
    display: "flex",
    paddingLeft: theme.spacing(3),
  },
  applicationDrawerPaper: {
    zIndex: 0,
    width: theme.spacing(32),
  },
}));
