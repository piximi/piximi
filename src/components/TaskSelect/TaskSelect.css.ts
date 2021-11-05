import { makeStyles } from "@mui/styles";
import { Theme } from "@mui/material";

export const useStyles = makeStyles((theme: Theme) => ({
  taskSelector: {
    minWidth: 140,
    marginTop: theme.spacing(1),
    marginLeft: theme.spacing(24),
  },
  trainFlagSelector: {
    minWidth: 320,
    marginTop: theme.spacing(1),
    marginLeft: theme.spacing(3),
  },
}));
