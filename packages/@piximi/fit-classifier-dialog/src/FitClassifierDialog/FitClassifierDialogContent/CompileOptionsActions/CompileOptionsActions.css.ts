import {Theme} from "@material-ui/core";
import {createStyles, makeStyles} from "@material-ui/styles";

const styles = ({spacing}: Theme) =>
  createStyles({
    actionsContainer: {
      marginBottom: spacing(2)
    },
    button: {
      marginTop: spacing(1),
      marginRight: spacing(1)
    },
    formControl: {
      width: "100%"
    }
  });

export const useStyles = makeStyles(styles);
