import { makeStyles } from "@material-ui/core/styles";

export const useStyles = makeStyles((theme) => ({
  stage: {
    position: "relative",
  },
  userEventsCanvas: {
    position: "absolute",
    zIndex: 3,
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
