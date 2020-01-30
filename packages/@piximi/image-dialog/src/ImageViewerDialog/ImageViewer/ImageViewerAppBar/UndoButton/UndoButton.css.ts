import {createStyles} from "@material-ui/core/styles";

const styles = () =>
  createStyles({
    root: {
      flexGrow: 1,
      backgroundColor: "#000"
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
    appbar: {
      backgroundColor: "#000",
      boxShadow: "none",
      width: "100%"
    },
    grow: {
      flexGrow: 1
    }
  });

export default styles;
