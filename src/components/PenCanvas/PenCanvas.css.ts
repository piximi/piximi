import { makeStyles } from "@material-ui/core/styles";

export const useStyles = makeStyles((theme) => ({
  canvasContainer: {
    bottom: 0,
    left: 0,
    position: "fixed",
    right: 0,
    top: 0,
    zIndex: 10,
  },
  canvasDrawing: {
    display: "block",
    height: "100%",
    left: 0,
    position: "absolute",
    top: 0,
    width: "100%",
    zIndex: 10,
  },
  canvasGrid: {
    display: "block",
    height: "100%",
    left: 0,
    position: "absolute",
    top: 0,
    width: "100%",
    zIndex: 14,
  },
  canvasInterface: {
    display: "block",
    height: "100%",
    left: 0,
    position: "absolute",
    top: 0,
    width: "100%",
    zIndex: 15,
  },
  canvasTmp: {
    display: "block",
    height: "100%",
    left: 0,
    position: "absolute",
    top: 0,
    width: "100%",
    zIndex: 12,
  },
}));
