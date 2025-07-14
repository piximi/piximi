import { Box, Typography } from "@mui/material";
import { useSelector } from "react-redux";
import { DIMENSIONS } from "utils/constants";
import {
  selectActivePlane,
  selectActiveTimepoint,
} from "views/ImageViewer/state/imageViewer/selectors";

export const CursorLocationContainer = ({
  absolutePosition,
  pixelColor,
  width,
  show,
}: {
  absolutePosition?: { x: number; y: number };
  pixelColor?: string;
  width: number;
  show: boolean;
}) => {
  const activeTimepoint = useSelector(selectActiveTimepoint);
  const activePlane = useSelector(selectActivePlane);
  return (
    <Box
      sx={(theme) => ({
        backgroundColor: theme.palette.background.paper,
        width: width - 2 + "px",
        height: DIMENSIONS.stageInfoHeight,
        justifyContent: "space-between",
        alignItems: "center",
        display: "flex",
        position: "absolute",
        bottom: 0,
        zIndex: 1000,
      })}
    >
      <Box sx={{ width: "50%" }}>
        {absolutePosition && show && (
          <Box
            sx={{
              width: "100%",
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              px: "1.5rem",
            }}
          >
            <Typography variant="body2">{`x: ${absolutePosition.x} y: ${absolutePosition.y} `}</Typography>
            <Typography variant="body2">{pixelColor}</Typography>
          </Box>
        )}
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          width: "50%",
          px: "1.5rem",
        }}
      >
        <Typography variant="body2">Timepoint: {activeTimepoint}</Typography>
        <Typography variant="body2">Plane: {activePlane}</Typography>
      </Box>
    </Box>
  );
};
