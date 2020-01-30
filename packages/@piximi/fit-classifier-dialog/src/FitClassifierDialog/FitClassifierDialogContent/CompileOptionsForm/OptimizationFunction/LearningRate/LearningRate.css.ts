import {Theme} from "@material-ui/core";
import {createStyles, makeStyles} from "@material-ui/styles";

const styles = ({spacing}: Theme) =>
  createStyles({
    textField: {
      width: "100%"
    }
  });

export const useStyles = makeStyles(styles);
