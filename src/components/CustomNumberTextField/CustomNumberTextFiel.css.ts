import { makeStyles } from "@mui/styles";
import { Theme } from "@mui/material";

export const useStyles = makeStyles((theme: Theme) => ({
  textField: {
    marginRight: theme.spacing(1),
    flexBasis: 300,
    marginTop: theme.spacing(2.75),
    width: "100%",
  },
}));
