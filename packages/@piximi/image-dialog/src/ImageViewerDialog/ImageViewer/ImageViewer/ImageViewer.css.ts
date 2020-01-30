import {createStyles} from "@material-ui/core/styles";

const styles = () =>
  createStyles({
    root: {
      flexGrow: 1
    },
    container: {
      bottom: "16px",
      position: "absolute",
      top: 0
    },
    flex: {
      flex: 1
    },
    menuButton: {
      marginLeft: -12,
      marginRight: 20,
      color: "#FFF"
    },
    globalButton: {
      marginLeft: -12,
      marginRight: 20,
      color: "#2196f3"
    },
    grow: {
      flexGrow: 1
    }
  });

export default styles;
