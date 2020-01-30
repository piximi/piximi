import {createStyles} from "@material-ui/core/styles";
import {Theme} from "@material-ui/core";

const drawerWidth = 280;

export const styles = (theme: Theme) =>
  createStyles({
    toolbar: {
      alignItems: "center",
      toolbar: theme.mixins.toolbar
    },
    drawerPaper: {
      position: "fixed",
      width: drawerWidth,
      boxShadow:
        "0 16px 24px 2px rgba(0,0,0,0.14),0 6px 30px 5px rgba(0,0,0,0.12),0 8px 10px -5px rgba(0,0,0,0.2)"
    }
  });
