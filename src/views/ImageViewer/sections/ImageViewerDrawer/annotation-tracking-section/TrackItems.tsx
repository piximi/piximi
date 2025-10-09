import {
  Button,
  Collapse,
  List,
  ListItem,
  ListItemText,
  Popover,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { TransitionGroup } from "react-transition-group";
import {
  CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ChromePicker, ColorResult } from "react-color";
import { useDispatch, useSelector } from "react-redux";
import { dataSlice } from "store/data";
import {
  selectTrackletRecord,
  // selectTrackletRecordByMetadata,
} from "store/data/selectors";
import { OperationButton } from "views/ImageViewer/components/OperationButton";

import {
  useSelectedTracklets,
  useTrackOperations,
} from "views/ImageViewer/state/TrackletContext";

interface RenderItemOptions {
  id: string;
  handleColorChange: (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    id: string,
  ) => void;
  bgColor: string;
  getHighlightColor: (id: string) => CSSProperties;
}

function renderItem({
  id,
  handleColorChange,
  bgColor,
  getHighlightColor,
}: RenderItemOptions) {
  return (
    <ListItem
      sx={(theme) => ({
        ...getHighlightColor(id),
        display: "flex",
        flexDirection: "row",
        borderBottom: `1px solid ${theme.palette.divider}`,
        bgcolor: theme.palette.background.paper,
        "&:hover": {
          bgcolor: theme.palette.background.default,
        },
      })}
      secondaryAction={
        <Button
          //edge="end"
          sx={{
            minWidth: "16px",
            height: "16px",
            borderRadius: 1,
            ml: 1,
            bgcolor: bgColor,
          }}
          onClick={(event) => handleColorChange(event, id)}
        />
      }
    >
      <ListItemText
        primary={id}
        slotProps={{
          primary: {
            variant: "body2",
            textOverflow: "ellipsis",
            noWrap: true,
            flexShrink: 1,
          },
        }}
      />
    </ListItem>
  );
}
export const TrackItems = () => {
  const dispatch = useDispatch();
  const trackletRecord = useSelector(selectTrackletRecord);
  //const metadataToTrackletRecord = useSelector(selectTrackletRecordByMetadata);
  const { clearSelectedTracks } = useTrackOperations();
  const { primaryTrack, secondaryTracks } = useSelectedTracklets();
  const [colorMenuAnchorEl, setColorMenuAnchorEl] =
    useState<null | HTMLButtonElement>(null);
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

  const renderedTracks = useMemo(() => {
    if (showTracks === "selected") {
      return selectedTrackIds;
    } else {
      return trackletIds;
    }
  }, [trackletIds, selectedTrackIds, showTracks]);

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

  const getHighlightColor = useCallback(
    (trackId: string) => {
      let borderColor: string;
      if (trackId === primaryTrack) borderColor = "#00d9ff";
      else if (secondaryTracks.includes(trackId)) borderColor = "#bb37f9";
      else return {};
      return { borderLeft: `2px solid ${borderColor}` };
    },
    [primaryTrack, secondaryTracks],
  );

  const handleOpenColorPicker = (
    event: React.MouseEvent<HTMLButtonElement>,
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
      <List
        disablePadding={true}
        sx={(theme) => ({
          maxHeight: "200px",
          height: "200px",
          overflowY: "scroll",
          width: "100%",
          bgcolor: theme.palette.background.paper,
          borderRadius: 1,
          border: `1px solid ${theme.palette.divider}`,
        })}
      >
        <TransitionGroup>
          {renderedTracks.map((id) => (
            <Collapse key={`track-id_${id}`}>
              {renderItem({
                id,
                handleColorChange: handleOpenColorPicker,
                bgColor:
                  id === trackletEditingId
                    ? (editedColor ?? "")
                    : trackletRecord[id].color,
                getHighlightColor,
              })}
            </Collapse>
          ))}
        </TransitionGroup>
      </List>

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
