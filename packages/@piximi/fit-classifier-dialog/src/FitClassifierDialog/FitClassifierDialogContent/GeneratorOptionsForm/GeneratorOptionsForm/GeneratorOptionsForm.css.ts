import {Theme} from "@material-ui/core";
import {createStyles, makeStyles} from "@material-ui/styles";

const styles = (theme: Theme) =>
  createStyles({
    typography: {
      marginBottom: theme.spacing(2),
      marginTop: theme.spacing(2)
    }
  });

export const useStyles = makeStyles(styles);
