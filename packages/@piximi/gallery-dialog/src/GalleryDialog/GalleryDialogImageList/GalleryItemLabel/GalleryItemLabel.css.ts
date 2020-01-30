import {createStyles} from "@material-ui/core/styles";

const styles = () =>
  createStyles({
    iconButton: {
      padding: "8px",
      position: "absolute",
      "&:hover": {
        background: "none"
      }
    }
  });

export default styles;
