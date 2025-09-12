import {
  Box,
  Button,
  Collapse,
  IconButton,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { Check as CheckIcon, Close as CloseIcon } from "@mui/icons-material";
import { DividerHeader } from "components/ui";
import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { annotatorSlice } from "views/ImageViewer/state/annotator";
import { ToolType } from "views/ImageViewer/utils/enums";
import {
  selectActiveMetadata,
  selectTimeLinkingAnnIds,
  selectTimeLinkingGlobalId,
  selectTimeLinkingState,
  selectZLinkingState,
} from "views/ImageViewer/state/image-viewer-data/selectors";
import { ImageViewerMetadataDetails } from "views/ImageViewer/state/image-viewer-data/types";
import { imageViewerDataSlice } from "views/ImageViewer/state/image-viewer-data/ImageViewerDataSlice";

export const AnnotationLinkingSection = () => {
  const activeMetadata = useSelector(selectActiveMetadata);

  return (
    <Stack gap={1}>
      <TLinkingControl activeMetadata={activeMetadata} />

      <ZLinkingControl activeMetadata={activeMetadata} />
    </Stack>
  );
};

export const ManualLinkingControl = ({
  onStart,
  onConfirm,
  onCancel,
  numLinked,
  maxLinked,
  globalId,
  active,
}: {
  onStart: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  numLinked: number;
  maxLinked: number;
  globalId: string | undefined;
  active: boolean;
}) => {
  return (
    <Stack>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          width: "100%",
          alignItems: "center",
        }}
      >
        <Typography variant="body2">Manual Linking:</Typography>

        <Box sx={{ display: "flex", flexDirection: "row" }}>
          <Button variant="text" onClick={onStart} disabled={active}>
            Start
          </Button>
          <IconButton size="small" onClick={onConfirm} disabled={!active}>
            <CheckIcon />
          </IconButton>
          <IconButton size="small" onClick={onCancel} disabled={!active}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>
      {globalId && (
        <Collapse in={active}>
          <Stack sx={{ width: "100%" }} gap={1}>
            <Typography variant="body2" textOverflow="ellipsis" noWrap={true}>
              Global Id: {globalId}
            </Typography>

            <Box
              sx={{
                width: "100%",
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="body2">Linked:</Typography>
              <Typography
                variant="body2"
                sx={{ px: 2 }}
              >{`${numLinked}/${maxLinked}`}</Typography>
            </Box>
          </Stack>
        </Collapse>
      )}
    </Stack>
  );
};

export const TLinkingControl = ({
  activeMetadata,
}: {
  activeMetadata: ImageViewerMetadataDetails | undefined;
}) => {
  const dispatch = useDispatch();
  const linkingActive = useSelector(selectTimeLinkingState);
  const globalId = useSelector(selectTimeLinkingGlobalId);
  const linkedAnnIds = useSelector(selectTimeLinkingAnnIds);
  const numLinked = useMemo(() => {
    return Object.keys(linkedAnnIds).length;
  }, [linkedAnnIds]);
  const maxLinked = useMemo(() => {
    return activeMetadata ? Object.keys(activeMetadata.images).length : 0;
  }, [activeMetadata]);
  const handleEnableLinking = () => {
    dispatch(
      annotatorSlice.actions.setToolType({
        operation: ToolType.Pointer,
      }),
    );
    dispatch(imageViewerDataSlice.actions.toggleTimeLinking(true));
  };
  const handleCancelLinking = () => {
    dispatch(imageViewerDataSlice.actions.toggleTimeLinking(false));
  };
  const handleConfirmLinking = () => {
    dispatch(imageViewerDataSlice.actions.toggleTimeLinking(false));
  };
  return (
    <Stack gap={1}>
      <DividerHeader typographyVariant="body2" textAlign="left" sx={{ mt: 2 }}>
        Time Linking
      </DividerHeader>
      <ManualLinkingControl
        onStart={handleEnableLinking}
        onConfirm={handleConfirmLinking}
        onCancel={handleCancelLinking}
        globalId={globalId}
        numLinked={numLinked}
        maxLinked={maxLinked}
        active={linkingActive}
      />

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
      <ManualLinkingControl
        onStart={handleEnableLinking}
        onConfirm={handleConfirmLinking}
        onCancel={handleCancelLinking}
        globalId={""}
        numLinked={numLinked}
        maxLinked={maxLinked}
        active={linkingActive}
      />

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
