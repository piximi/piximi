import { makeStyles } from "@material-ui/core/styles";

const drawerWidth = 80;

export const useStyles = makeStyles((theme) => ({
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
  },
  drawerPaper: {
    padding: 8,
    width: drawerWidth,
  },
}));
