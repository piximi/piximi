import {Theme} from "@material-ui/core";
import {createStyles, makeStyles} from "@material-ui/styles";

const styles = ({spacing}: Theme) =>
  createStyles({
    appBar: {
      backgroundColor: "transparent !important",
      borderBottom: "1px solid rgba(0, 0, 0, 0.12) !important",
      boxShadow: "none !important"
    },
    leftIcon: {
      marginRight: spacing(1)
    },
    grow: {
      flexGrow: 1
    }
  });

export const useStyles = makeStyles(styles);
