import {Theme} from "@material-ui/core";
import {createStyles, makeStyles} from "@material-ui/styles";

const styles = ({spacing}: Theme) =>
  createStyles({
    button: {
      marginTop: spacing(1),
      marginRight: spacing(1)
    }
  });

export const useStyles = makeStyles(styles);
