import { makeStyles } from "@mui/styles";

import { Theme } from "@mui/material";

export const useStyles = makeStyles((theme: Theme) => ({
  button: {
    margin: theme.spacing(1),
    textTransform: "none",
  },
}));
