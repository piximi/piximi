import { makeStyles } from "@material-ui/core/styles";

export const useStyles = makeStyles((theme) => ({
  canvas: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  userEventsCanvas: {
    zIndex: 3,
  },
  masksCanvas: {
    zIndex: 2,
  },
  backgroundCanvas: {
    zIndex: 1,
  },
}));
