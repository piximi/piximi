import {
  CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Button,
  Collapse,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Popover,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { ChromePicker, ColorResult } from "react-color";
import { TransitionGroup } from "react-transition-group";

import { dataSlice } from "store/data";
import {
  selectTrackletEntities,
  // selectTrackletRecordByMetadata,
} from "store/data/selectors";

import { OperationButton } from "views/ImageViewer/components/OperationButton";
import { selectSelectedTracklets } from "views/ImageViewer/state/image-viewer-data/selectors";
import { imageViewerDataSlice } from "views/ImageViewer/state/image-viewer-data/ImageViewerDataSlice";

interface RenderItemOptions {
  id: string;
  name?: string;
  handleColorChange: (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    id: string,
  ) => void;
  bgColor: string;
  handleClick: (id: string) => void;
  getHighlightColor: (id: string) => CSSProperties;
}

function renderItem({
  id,
  name,
  handleColorChange,
  bgColor,
  handleClick,
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
      <ListItemButton onClick={() => handleClick(id)} dense>
        <ListItemText
          primary={name ?? id}
          slotProps={{
            primary: {
              variant: "body2",
              textOverflow: "ellipsis",
              noWrap: true,
              flexShrink: 1,
            },
          }}
        />
      </ListItemButton>
    </ListItem>
  );
}
export const TrackList = () => {
  const dispatch = useDispatch();
  const trackletRecord = useSelector(selectTrackletEntities);
  //const metadataToTrackletRecord = useSelector(selectTrackletRecordByMetadata);
  const selectedTrackIds = useSelector(selectSelectedTracklets);

  const [colorMenuAnchorEl, setColorMenuAnchorEl] =
    useState<null | HTMLButtonElement>(null);
  const [trackletEditingId, setTrackEditingId] = useState<string>();
  const [showTracks, setShowTracks] = useState<"all" | "selected">("all");
  const [editedColor, setEditedColor] = useState<string>();

  const sortedTrackletIds = useMemo(() => {
    const sortedIds = new Set(
      Object.keys(trackletRecord).sort(
        (a, b) => trackletRecord[a].start! - trackletRecord[b].start!,
      ),
    );
    const orderedIds: string[] = [];
    for (const id of sortedIds) {
      orderedIds.push(id);
      if (trackletRecord[id].children)
        trackletRecord[id].children.forEach((id) => {
          orderedIds.push(id);
          sortedIds.delete(id);
        });
    }
    return orderedIds;
  }, [trackletRecord]);

  const renderedTracks = useMemo(() => {
    if (showTracks === "selected") {
      return selectedTrackIds;
    } else {
      return sortedTrackletIds;
    }
  }, [sortedTrackletIds, selectedTrackIds, showTracks]);

  const colorPopupOpen = useMemo(
    () => Boolean(colorMenuAnchorEl),
    [colorMenuAnchorEl],
  );

  const onCloseColorPicker = () => {
    if (trackletEditingId && editedColor)
      dispatch(
        dataSlice.actions.updateTrackletColor({
          id: trackletEditingId,
          color: editedColor,
        }),
      );
    setTrackEditingId(undefined);
    setEditedColor(undefined);
    setColorMenuAnchorEl(null);
  };

  const getHighlightColor = useCallback(
    (trackId: string) => {
      let borderColor: string;
      if (selectedTrackIds.includes(trackId)) borderColor = "#bb37f9";
      else return {};
      return { borderLeft: `2px solid ${borderColor}` };
    },
    [selectedTrackIds],
  );

  const handleOpenColorPicker = (
    event: React.MouseEvent<HTMLButtonElement>,
    id: string,
  ) => {
    event.stopPropagation();
    setTrackEditingId(id);
    setColorMenuAnchorEl(event.currentTarget);
  };

  const handleSelectTracklet = (id: string) => {
    dispatch(imageViewerDataSlice.actions.toggleSelectedTrack(id));
  };

  useEffect(() => {
    if (!trackletEditingId || !trackletRecord[trackletEditingId])
      setEditedColor("black");
    else {
      setEditedColor(trackletRecord[trackletEditingId].color);
    }
  }, [trackletRecord, trackletEditingId]);

  return (
    <Stack
      sx={{
        maxWidth: "100%",
        alignItems: "center",
        gap: 1.5,
        height: "100%",
        minHeight: 0,
        pt: 1,
      }}
    >
      <ToggleButtonGroup
        value={showTracks}
        exclusive
        size="small"
        sx={{ "& > button": { py: "3px", px: "9px", fontSize: "0.75rem" } }}
        disabled={sortedTrackletIds.length === 0}
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
          flexGrow: 1,
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
                name: trackletRecord[id].name,
                handleColorChange: handleOpenColorPicker,
                handleClick: handleSelectTracklet,
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
        onClick={() =>
          dispatch(imageViewerDataSlice.actions.clearTrackSelection())
        }
        disabled={selectedTrackIds.length === 0}
        sx={{ pb: 2 }}
      >
        Clear Selection
      </OperationButton>
    </Stack>
  );
};
