import { makeStyles } from "@material-ui/core/styles";

export const useStyles = makeStyles((theme) => ({
  gridContainer: {
    width: "100%",
  },
  item: {
    backgroundColor: "white",
  },
  message: {
    width: "100%",
  },
  snackbar: {
    width: theme.spacing(64),
  },
}));
