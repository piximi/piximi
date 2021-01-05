import { makeStyles } from "@material-ui/core/styles";

const drawerWidth = 80 + 240;

export const useStyles = makeStyles((theme) => ({
  appBar: {
    width: `calc(100% - ${drawerWidth}px)`,
    marginRight: drawerWidth,
  },
}));
