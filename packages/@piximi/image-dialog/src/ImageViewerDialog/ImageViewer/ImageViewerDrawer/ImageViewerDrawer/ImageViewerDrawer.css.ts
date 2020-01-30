import {createStyles} from "@material-ui/core/styles";

const drawerWidth = 280;

const styles = () =>
  createStyles({
    drawerPaper: {
      width: drawerWidth
    },
    content: {
      width: "400px"
    }
  });

export default styles;
