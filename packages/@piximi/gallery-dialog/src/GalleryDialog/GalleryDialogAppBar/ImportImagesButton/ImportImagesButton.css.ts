import {createStyles} from "@material-ui/core/styles";
import {Theme} from "@material-ui/core";

const styles = (theme: Theme) =>
  createStyles({
    button: {
      textTransform: "none",
      fontSize: "1rem",
      borderRadius: theme.spacing(1),
      padding: theme.spacing(1),
      fontWeight: "inherit",
      letterSpacing: "inherit"
    },
    icon: {
      paddingRight: theme.spacing(1),
      paddingTop: "4px",
      paddingBottom: "4px"
    }
  });

export default styles;
