import { makeStyles } from "@material-ui/core/styles";

export const useStyles = makeStyles((theme) => ({
  stage: {
    // display: "flex",
    // flexDirection: "column",
    // justifyContent: "center",
    // alignItems: "center",
    position: "relative",
    border: "2px solid red",
  },
  userEventsCanvas: {
    position: "absolute",
    zIndex: 3,
    height: "100%",
    width: "100%",
  },
  masksCanvas: {
    position: "absolute",
    zIndex: 2,
  },
  backgroundCanvas: {
    position: "absolute",
    zIndex: 1,
    border: "dashed",
  },
}));
