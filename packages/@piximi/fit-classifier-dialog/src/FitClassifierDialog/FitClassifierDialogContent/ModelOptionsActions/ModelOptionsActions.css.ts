import {Theme} from "@material-ui/core";
import {createStyles, makeStyles} from "@material-ui/styles";

const styles = (theme: Theme) =>
  createStyles({
    actionsContainer: {
      marginBottom: theme.spacing(2)
    },
    button: {
      marginTop: theme.spacing(1),
      marginRight: theme.spacing(1)
    },
    formControl: {
      width: "100%"
    }
  });

export const useStyles = makeStyles(styles);
