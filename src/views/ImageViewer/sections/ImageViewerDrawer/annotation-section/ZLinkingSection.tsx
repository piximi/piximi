import { Box, Button, Stack, Switch, Typography } from "@mui/material";
import { DividerHeader } from "components/ui";
import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { annotatorSlice } from "views/ImageViewer/state/annotator";
import { imageViewerDataSlice } from "views/ImageViewer/state/image-viewer-data/ImageViewerDataSlice";
import {
  selectActiveMetadata,
  selectZLinkingState,
} from "views/ImageViewer/state/image-viewer-data/selectors";
import { ImageViewerMetadataDetails } from "views/ImageViewer/state/image-viewer-data/types";
import { ToolType } from "views/ImageViewer/utils/enums";

export const ZLinkingSection = () => {
  const activeMetadata = useSelector(selectActiveMetadata);

  return (
    <Stack>
      <Typography
        sx={(theme) => ({
          width: "90%",
          textAlign: "center",
          mx: "auto",
          py: 1,
          borderBottom: `1px solid ${theme.palette.divider}`,
        })}
      >
        Tracking
      </Typography>
      <Stack gap={1}>
        <ZLinkingControl activeMetadata={activeMetadata} />
      </Stack>
    </Stack>
  );
};

export const ZLinkingControl = ({
  activeMetadata,
}: {
  activeMetadata: ImageViewerMetadataDetails | undefined;
}) => {
  const dispatch = useDispatch();
  const linkingActive = useSelector(selectZLinkingState);
  const numLinked = useMemo(() => {
    return 0;
  }, []);
  const maxLinked = useMemo(() => {
    return activeMetadata ? activeMetadata.activeSrcs.length : 0;
  }, [activeMetadata]);
  const handleEnableLinking = () => {
    dispatch(
      annotatorSlice.actions.setToolType({
        operation: ToolType.Pointer,
      }),
    );
    dispatch(imageViewerDataSlice.actions.toggleZLinking(true));
  };
  const handleCancelLinking = () => {
    dispatch(imageViewerDataSlice.actions.toggleZLinking(false));
  };
  const handleConfirmLinking = () => {
    dispatch(imageViewerDataSlice.actions.toggleZLinking(false));
  };
  return (
    <Stack gap={1}>
      <DividerHeader typographyVariant="body2" textAlign="left" sx={{ mt: 2 }}>
        Z Linking
      </DividerHeader>
      {/* <ManualLinkingControl
        onStart={handleEnableLinking}
        onConfirm={handleConfirmLinking}
        onCancel={handleCancelLinking}
        trackId={""}
        numLinked={numLinked}
        maxLinked={maxLinked}
        active={linkingActive}
      /> */}

      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          width: "100%",
          alignItems: "center",
        }}
      >
        <Typography variant="body2">Auto-Linking:</Typography>
        <Button variant="text" disabled={true}>
          Link
        </Button>
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          width: "100%",
          alignItems: "center",
        }}
      >
        <Typography variant="body2">Interpolation:</Typography>
        <Switch size="small" />
      </Box>
    </Stack>
  );
};
