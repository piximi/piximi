import { makeStyles } from "@mui/material";

export const useStyles = makeStyles((theme: any) => ({
  leftIcon: {
    marginRight: theme.spacing(1),
  },
  button: {},
  grow: {
    flexGrow: 1,
  },
  appBar: {
    position: "relative",
    backgroundColor: "transparent",
    boxShadow: "none",
    borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
  },
  appBarShift: {},
  appBarShiftLeft: {},
}));
