import { makeStyles } from "@mui/styles";
import { Theme } from "@mui/material";

export const useStyles = makeStyles((theme: Theme) => ({
  appBar: {
    transition: theme.transitions.create(["margin", "width"], {
      duration: theme.transitions.duration.leavingScreen,
      easing: theme.transitions.easing.sharp,
    }),
  },
  closeButton: {
    marginRight: theme.spacing(2),
  },
  count: {
    flexGrow: 1,
  },
}));
