import {Theme} from "@material-ui/core";
import {createStyles, makeStyles} from "@material-ui/styles";

const styles = ({spacing}: Theme) =>
  createStyles({
    formControl: {
      margin: spacing(3)
    },
    formLabel: {
      transform: "translate(0, 1.5px) scale(0.75)",
      transformOrigin: "top left"
    }
  });

export const useStyles = makeStyles(styles);
