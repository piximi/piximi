import {Theme} from "@material-ui/core";
import {createStyles, makeStyles} from "@material-ui/styles";

const styles = (theme: Theme) =>
  createStyles({
    button: {
      marginTop: theme.spacing(1),
      marginRight: theme.spacing(1)
    }
  });

export const useStyles = makeStyles(styles);
