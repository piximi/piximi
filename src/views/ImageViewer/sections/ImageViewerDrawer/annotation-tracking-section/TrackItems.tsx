import {
  Box,
  Collapse,
  Popover,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChromePicker, ColorResult } from "react-color";
import { useDispatch, useSelector } from "react-redux";
import { dataSlice } from "store/data";
import { selectTrackletRecord } from "store/data/selectors";
import { OperationButton } from "views/ImageViewer/components/OperationButton";
import { selectActiveTrackId } from "views/ImageViewer/state/image-viewer-data/selectors";
import {
  useSelectedTracklets,
  useTrackOperations,
} from "views/ImageViewer/state/TrackletContext";

export const TrackItems = () => {
  const dispatch = useDispatch();
  const activeTrackId = useSelector(selectActiveTrackId);
  const trackletRecord = useSelector(selectTrackletRecord);
  const { clearSelectedTracks } = useTrackOperations();
  const { primaryTrack, secondaryTracks } = useSelectedTracklets();
  const [colorMenuAnchorEl, setColorMenuAnchorEl] =
    useState<null | HTMLDivElement>(null);
  const [trackletEditingId, setTrackEditingId] = useState<string>();
  const [showTracks, setShowTracks] = useState<"all" | "selected">("all");
  const [editedColor, setEditedColor] = useState<string>();

  const selectedTrackIds = useMemo(() => {
    const selectedTracks = primaryTrack ? [primaryTrack] : [];
    selectedTracks.push(...secondaryTracks);
    return selectedTracks;
  }, [primaryTrack, secondaryTracks, trackletRecord]);

  const trackletIds = useMemo(
    () => Object.keys(trackletRecord),
    [trackletRecord],
  );

  const colorPopupOpen = useMemo(
    () => Boolean(colorMenuAnchorEl),
    [colorMenuAnchorEl],
  );

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

  const shouldShowItem = useCallback(
    (trackId: string) => {
      return showTracks === "all" ? true : selectedTrackIds.includes(trackId);
    },
    [showTracks, selectedTrackIds],
  );

  const highlightColor = useCallback(
    (trackId: string) => {
      let borderColor: string;
      if (trackId === primaryTrack) borderColor = "#00d9ff";
      else if (secondaryTracks.includes(trackId)) borderColor = "#bb37f9";
      else return {};
      return { borderLeft: `2px solid ${borderColor}` };
    },
    [primaryTrack, secondaryTracks],
  );

  const onOpenColorPicker = (
    event: React.MouseEvent<HTMLDivElement>,
    id: string,
  ) => {
    event.stopPropagation();
    setTrackEditingId(id);
    setColorMenuAnchorEl(event.currentTarget);
  };

  useEffect(() => {
    if (!trackletEditingId || !trackletRecord[trackletEditingId])
      setEditedColor("black");
    else {
      setEditedColor(trackletRecord[trackletEditingId].color);
    }
  }, [trackletRecord, trackletEditingId]);

  return (
    <Stack sx={{ maxWidth: "100%", alignItems: "center", gap: 1 }}>
      <ToggleButtonGroup
        value={showTracks}
        exclusive
        size="small"
        sx={{ "& > button": { py: "3px", px: "9px", fontSize: "0.75rem" } }}
        disabled={trackletIds.length === 0}
      >
        <ToggleButton
          value="all"
          size="small"
          onClick={() => showTracks !== "all" && setShowTracks("all")}
        >
          All
        </ToggleButton>
        <ToggleButton
          value="selected"
          size="small"
          onClick={() => showTracks !== "selected" && setShowTracks("selected")}
        >
          Selected
        </ToggleButton>
      </ToggleButtonGroup>
      <ToggleButtonGroup
        orientation="vertical"
        value={activeTrackId}
        exclusive
        onChange={() => {}}
        sx={{
          px: 0.5,
          maxHeight: "200px",
          overflowY: "scroll",
          maxWidth: "100%",
        }}
      >
        {trackletIds.map((id) => (
          <Collapse
            key={`track-id_${id}`}
            in={shouldShowItem(id)}
            timeout={300}
            sx={{ maxWidth: "100%" }}
          >
            <ToggleButton
              value={id}
              aria-label="list"
              sx={{
                display: "flex",
                maxWidth: "100%",
                ...highlightColor(id),
              }}
            >
              <Typography
                variant="body2"
                textOverflow="ellipsis"
                noWrap={true}
                sx={{ flexShrink: 1 }}
              >
                {id}
              </Typography>
              <Box
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
          </Collapse>
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
      <OperationButton
        variant="text"
        onClick={clearSelectedTracks}
        disabled={!primaryTrack}
      >
        Clear Selection
      </OperationButton>
    </Stack>
  );
};
