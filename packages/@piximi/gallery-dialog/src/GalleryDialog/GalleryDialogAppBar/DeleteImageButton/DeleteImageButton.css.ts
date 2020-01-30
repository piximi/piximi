import {createStyles} from "@material-ui/core/styles";
import {Theme} from "@material-ui/core";

export const styles = ({palette, spacing}: Theme) =>
  createStyles({
    button: {
      padding: "8px"
    },
    icon: {
      padding: "4px 8px"
    }
  });
