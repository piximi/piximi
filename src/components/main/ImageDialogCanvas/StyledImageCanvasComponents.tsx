import { styled } from "@mui/styles";

export const StyleBackgroundCanvas = styled("canvas")({
  position: "absolute",
  zIndex: 1,
});

export const StyledMasksCanvas = styled("canvas")({
  position: "absolute",
  zIndex: 2,
});

export const StyledUserEventsCanvas = styled("canvas")({
  position: "absolute",
  zIndex: 3,
});

export const StyledStage = styled("div")({
  position: "relative",
});
