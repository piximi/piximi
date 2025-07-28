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
import { selectActiveImageSeries } from "views/ImageViewer/state/imageViewer/selectors";
import {
  selectTimeLinkingAnnIds,
  selectTimeLinkingGlobalId,
  selectTimeLinkingState,
  selectZLinkingState,
} from "views/ImageViewer/state/annotator/selectors";
import { ToolType } from "views/ImageViewer/utils/enums";
import { ImageViewerImageDetails } from "views/ImageViewer/utils/types";

export const AnnotationLinkingSection = () => {
  const dispatch = useDispatch();
  const activeImageSeries = useSelector(selectActiveImageSeries);

  return (
    <Stack gap={1}>
      <TLinkingControl activeImageSeries={activeImageSeries} />

      <ZLinkingControl activeImageSeries={activeImageSeries} />
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
  activeImageSeries,
}: {
  activeImageSeries: ImageViewerImageDetails | undefined;
}) => {
  const dispatch = useDispatch();
  const linkingActive = useSelector(selectTimeLinkingState);
  const globalId = useSelector(selectTimeLinkingGlobalId);
  const linkedAnnIds = useSelector(selectTimeLinkingAnnIds);
  const numLinked = useMemo(() => {
    return Object.keys(linkedAnnIds).length;
  }, [linkedAnnIds]);
  const maxLinked = useMemo(() => {
    return activeImageSeries
      ? Object.keys(activeImageSeries.timepoints).length
      : 0;
  }, [activeImageSeries]);
  const handleEnableLinking = () => {
    dispatch(
      annotatorSlice.actions.setToolType({
        operation: ToolType.Pointer,
      }),
    );
    dispatch(annotatorSlice.actions.toggleTimeLinking({ active: true }));
  };
  const handleCancelLinking = () => {
    dispatch(annotatorSlice.actions.toggleTimeLinking({ active: false }));
  };
  const handleConfirmLinking = () => {
    dispatch(annotatorSlice.actions.toggleTimeLinking({ active: false }));
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
  activeImageSeries,
}: {
  activeImageSeries: ImageViewerImageDetails | undefined;
}) => {
  const dispatch = useDispatch();
  const linkingActive = useSelector(selectZLinkingState);
  const numLinked = useMemo(() => {
    return 0;
  }, []);
  const maxLinked = useMemo(() => {
    return 0;
  }, []);
  const handleEnableLinking = () => {
    dispatch(
      annotatorSlice.actions.setToolType({
        operation: ToolType.Pointer,
      }),
    );
    dispatch(annotatorSlice.actions.toggleZLinking({ active: true }));
  };
  const handleCancelLinking = () => {
    dispatch(annotatorSlice.actions.toggleZLinking({ active: false }));
  };
  const handleConfirmLinking = () => {
    dispatch(annotatorSlice.actions.toggleZLinking({ active: false }));
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
