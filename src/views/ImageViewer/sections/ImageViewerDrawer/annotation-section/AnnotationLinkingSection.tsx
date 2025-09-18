import {
  Box,
  Button,
  Collapse,
  IconButton,
  Popover,
  Stack,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { Check as CheckIcon, Close as CloseIcon } from "@mui/icons-material";
import { DividerHeader } from "components/ui";
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { annotatorSlice } from "views/ImageViewer/state/annotator";
import { ToolType } from "views/ImageViewer/utils/enums";
import {
  selectActiveTrackId,
  selectActiveMetadata,
  selectTimeTrackingRecord,
  selectTimeLinkingState,
  selectZLinkingState,
} from "views/ImageViewer/state/image-viewer-data/selectors";
import { ImageViewerMetadataDetails } from "views/ImageViewer/state/image-viewer-data/types";
import { imageViewerDataSlice } from "views/ImageViewer/state/image-viewer-data/ImageViewerDataSlice";
import { selectTrackletRecord } from "store/data/selectors";
import { dataSlice } from "store/data";
import { generateUUID } from "store/data/utils";
import { ChromePicker, ColorResult } from "react-color";

function getRandomColor() {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

export const AnnotationLinkingSection = () => {
  const activeMetadata = useSelector(selectActiveMetadata);

  return (
    <Stack gap={1}>
      <TLinkingControl activeMetadata={activeMetadata} />

      <ZLinkingControl activeMetadata={activeMetadata} />
    </Stack>
  );
};

export const ManualLinkingControl = ({ active }: { active: boolean }) => {
  const dispatch = useDispatch();
  const activeTrackId = useSelector(selectActiveTrackId);
  const trackletRecord = useSelector(selectTrackletRecord);

  const [trackletEditingId, setTrackEditingId] = useState<string>();
  const [colorMenuAnchorEl, setColorMenuAnchorEl] =
    useState<null | HTMLButtonElement>(null);
  const [editedColor, setEditedColor] = useState<string>();
  const trackletIds = useMemo(
    () => Object.keys(trackletRecord),
    [trackletRecord],
  );
  const colorPopupOpen = useMemo(
    () => Boolean(colorMenuAnchorEl),
    [colorMenuAnchorEl],
  );

  const handleEnableLinking = () => {
    dispatch(
      annotatorSlice.actions.setToolType({
        operation: ToolType.Pointer,
      }),
    );
    const newTrackletId = generateUUID();
    dispatch(imageViewerDataSlice.actions.startNewTrack(newTrackletId));
    dispatch(
      dataSlice.actions.addTracklet({
        trackId: newTrackletId,
        color: getRandomColor(),
        linkedIds: [],
      }),
    );
  };
  const handleCancelLinking = () => {
    dispatch(imageViewerDataSlice.actions.removeActiveTrack());
    activeTrackId && dispatch(dataSlice.actions.deleteTracklet(activeTrackId));
  };
  const handleConfirmLinking = () => {
    dispatch(imageViewerDataSlice.actions.toggleTimeLinking(false));
  };
  const handleSelectTrack = (
    event: React.MouseEvent<HTMLElement, MouseEvent>,
    value: string,
  ) => {
    dispatch(imageViewerDataSlice.actions.setTLinkingTrackId(value));
  };

  const onOpenColorPicker = (
    event: React.MouseEvent<HTMLButtonElement>,
    id: string,
  ) => {
    event.stopPropagation();
    setTrackEditingId(id);
    setColorMenuAnchorEl(event.currentTarget);
  };
  const onCloseColorPicker = () => {
    if (trackletEditingId && editedColor)
      dispatch(
        dataSlice.actions.updateTracklet({
          id: trackletEditingId,
          changes: { color: editedColor },
        }),
      );
    setTrackEditingId(undefined);
    setEditedColor(undefined);
    setColorMenuAnchorEl(null);
  };

  useEffect(() => {
    if (!trackletEditingId || !trackletRecord[trackletEditingId])
      setEditedColor("black");
    else {
      setEditedColor(trackletRecord[trackletEditingId].color);
    }
  }, [trackletRecord, trackletEditingId]);
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
        <Button
          variant="text"
          size="small"
          onClick={handleEnableLinking}
          disabled={active}
        >
          New Track
        </Button>

        <Box sx={{ display: "flex", flexDirection: "row" }}>
          <Button
            variant="text"
            size="small"
            onClick={handleConfirmLinking}
            disabled={!active}
          >
            Confirm
          </Button>
          <Button
            size="small"
            variant="text"
            onClick={handleCancelLinking}
            disabled={!active}
          >
            Delete
          </Button>
        </Box>
      </Box>

      <Typography variant="body2">Tracks:</Typography>
      <ToggleButtonGroup
        orientation="vertical"
        value={activeTrackId}
        exclusive
        onChange={() => {}}
        sx={{ px: 0.5, maxHeight: "200px", overflowY: "scroll" }}
      >
        {trackletIds.map((id) => (
          <ToggleButton
            key={`track-id_${id}`}
            value={id}
            aria-label="list"
            onClick={handleSelectTrack}
            sx={{ display: "flex" }}
          >
            <Typography
              variant="body2"
              textOverflow="ellipsis"
              noWrap={true}
              sx={{ flexShrink: 1 }}
            >
              {id}
            </Typography>
            <Button
              sx={{
                minWidth: "16px",
                height: "16px",
                borderRadius: 1,
                ml: 1,
                bgcolor:
                  id === trackletEditingId
                    ? editedColor
                    : trackletRecord[id].color,
              }}
              onClick={(event) => onOpenColorPicker(event, id)}
            />
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      <Popover
        id="image-color-selection-menu"
        open={colorPopupOpen}
        anchorEl={colorMenuAnchorEl}
        onClose={onCloseColorPicker}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
      >
        <ChromePicker
          color={editedColor}
          onChangeComplete={(color: ColorResult) => {
            if (!trackletEditingId) return;
            setEditedColor(color.hex);
          }}
        />
      </Popover>
    </Stack>
  );
};

export const TLinkingControl = ({
  activeMetadata,
}: {
  activeMetadata: ImageViewerMetadataDetails | undefined;
}) => {
  const linkingActive = useSelector(selectTimeLinkingState);

  return (
    <Stack gap={1}>
      <DividerHeader typographyVariant="body2" textAlign="left" sx={{ mt: 2 }}>
        Time Linking
      </DividerHeader>
      <ManualLinkingControl active={linkingActive} />

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
