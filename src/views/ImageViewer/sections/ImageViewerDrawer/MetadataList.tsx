import React, { memo, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Avatar,
  Box,
  Chip,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";

import { MetadataMenu } from "./MetadataMenu";

import { selectMetadataToAnnotationIds } from "store/data/selectors";
import { ImageViewerMetadataDetails } from "views/ImageViewer/state/image-viewer-data/types";
import {
  selectActiveMetadataId,
  selectMetadataStackArray,
} from "views/ImageViewer/state/image-viewer-data/selectors";
import { imageViewerDataSlice } from "views/ImageViewer/state/image-viewer-data/ImageViewerDataSlice";

const NUM_BUFFERED_IMS = 20;
const NUM_VIEW_IMS = Math.floor(NUM_BUFFERED_IMS / 4);

interface MetadataListItemProps {
  metadataDetails: ImageViewerMetadataDetails;
  annotationCount: number;
  isActive: boolean;
  onItemClick: (image: ImageViewerMetadataDetails) => void;
  onSecondaryClick: (target: HTMLElement) => void;
}

export const MetadataList = () => {
  const dispatch = useDispatch();
  const metadataStackArray = useSelector(selectMetadataStackArray);
  const activeMetadataId = useSelector(selectActiveMetadataId);
  const metadataToAnnotationIds = useSelector(selectMetadataToAnnotationIds);

  const [imageAnchorEl, setImageAnchorEl] = React.useState<null | HTMLElement>(
    null,
  );
  const [bufferRange, setBufferRange] = React.useState({
    start: 0,
    end: NUM_BUFFERED_IMS,
  });
  const [scrollProgress, setScrollProgress] = React.useState(0);
  const [selectedMetadataIndex, setSelectedMetadataIndex] = React.useState(0);

  const handleMetadataItemClick = React.useCallback(
    (metadataDetails: ImageViewerMetadataDetails) => {
      if (metadataDetails.id !== activeMetadataId!) {
        dispatch(
          imageViewerDataSlice.actions.setActiveMetadataId({
            metadataId: metadataDetails.id,
            prevMetadataId: activeMetadataId,
          }),
        );
      }
    },
    [dispatch, activeMetadataId],
  );

  const handleMetadataMenuOpen = React.useCallback(
    (target: HTMLElement, imageIndex: number) => {
      setImageAnchorEl(target);
      setSelectedMetadataIndex(imageIndex);
    },
    [],
  );

  const onImageMenuClose = () => {
    setImageAnchorEl(null);
  };

  const handleScroll = (evt: React.UIEvent<HTMLDivElement, UIEvent>) => {
    const target = evt.target as HTMLDivElement;

    if (
      target.scrollHeight - target.scrollTop === target.clientHeight &&
      bufferRange.end < metadataStackArray.length
    ) {
      const numToLoad = metadataStackArray.length - bufferRange.end;
      const numHidden = NUM_BUFFERED_IMS - NUM_VIEW_IMS;
      const newStart =
        numToLoad < numHidden
          ? bufferRange.start
          : bufferRange.start + NUM_BUFFERED_IMS - NUM_VIEW_IMS + 1;

      const newEnd = bufferRange.end + NUM_BUFFERED_IMS - NUM_VIEW_IMS + 1;

      setBufferRange({
        start: newStart,
        end: newEnd,
      });

      setScrollProgress((newEnd / metadataStackArray.length) * 100);

      target.scrollTop = 1;
    } else if (target.scrollTop === 0 && bufferRange.start !== 0) {
      const newStart = bufferRange.start - NUM_BUFFERED_IMS + NUM_VIEW_IMS - 1;
      const newEnd = bufferRange.end - NUM_BUFFERED_IMS + NUM_VIEW_IMS - 1;

      setBufferRange({
        start: newStart,
        end: newEnd,
      });

      setScrollProgress((newEnd / metadataStackArray.length) * 100);

      target.scrollTop = target.scrollHeight - target.clientHeight - 1;
    }
  };

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
        Images
      </Typography>
      <Box
        display="grid"
        gridTemplateColumns="repeat(12, 1fr)"
        gridTemplateRows="1fr"
      >
        <Box gridColumn="1 / 13" gridRow="1 / 2">
          <List
            dense
            disablePadding
            component="div"
            sx={(theme) => ({
              maxHeight: `${3 * NUM_VIEW_IMS + 0.5}rem`,
              overflowY: "scroll",
              "::-webkit-scrollbar": { display: "none" },
              width: "calc(100% - 5px)",
              backgroundColor: theme.palette.background.paper,
            })}
            onScroll={handleScroll}
          >
            {metadataStackArray
              .slice(bufferRange.start, bufferRange.end)
              .map((metadataDetails, idx) => {
                return (
                  <MetadataListItem
                    key={metadataDetails.id}
                    metadataDetails={metadataDetails}
                    annotationCount={
                      metadataToAnnotationIds[metadataDetails.id].length
                    }
                    isActive={metadataDetails.id === activeMetadataId}
                    onItemClick={handleMetadataItemClick}
                    onSecondaryClick={(event) =>
                      handleMetadataMenuOpen(event, bufferRange.start + idx)
                    }
                  />
                );
              })}
          </List>
        </Box>
        <Box gridColumn="12 / 13" gridRow=" 1 / 2" justifyItems="flex-end">
          {metadataStackArray.length > NUM_BUFFERED_IMS && (
            <LinearProgress
              sx={{
                width: 4,
                height: `${3 * NUM_VIEW_IMS}rem`,

                marginLeft: "auto",
                "& span.MuiLinearProgress-bar": {
                  transform: `translateY(-${100 - scrollProgress}%) !important`, //has to have !important
                },
              }}
              variant="determinate"
              value={scrollProgress}
            />
          )}
        </Box>
      </Box>

      <MetadataMenu
        anchorElImageMenu={imageAnchorEl}
        selectedMetadata={metadataStackArray[selectedMetadataIndex]}
        annotationIds={
          metadataToAnnotationIds[
            metadataStackArray[selectedMetadataIndex]?.id ?? 0
          ]
        }
        onCloseImageMenu={onImageMenuClose}
        openImageMenu={Boolean(imageAnchorEl)}
      />
    </Stack>
  );
};
const MetadataListItem = memo(
  ({
    metadataDetails,
    annotationCount,
    isActive,
    onItemClick,
    onSecondaryClick,
  }: MetadataListItemProps) => {
    const listItemRef = useRef<HTMLLIElement | null>(null);

    const thumbnailImage = useMemo(() => {
      if (metadataDetails.activeSrcs.length === 1) {
        return metadataDetails.activeSrcs[0];
      }
      return metadataDetails.activeSrcs[metadataDetails.activePlane];
    }, [metadataDetails]);
    return (
      <Tooltip
        title={metadataDetails.name}
        placement="bottom"
        disableInteractive={true}
        enterDelay={500}
        enterNextDelay={500}
        arrow={true}
        slotProps={{
          tooltip: {
            sx: {
              backgroundColor: "#565656",
              fontSize: "0.85rem",
            },
          },
          arrow: {
            sx: { color: "#565656" },
          },
        }}
      >
        <span>
          <ListItem
            secondaryAction={
              <IconButton
                edge="end"
                onClick={(event) => onSecondaryClick(event.currentTarget)}
                size={
                  listItemRef.current?.classList.contains("MuiListItem-dense")
                    ? "small"
                    : "medium"
                }
                sx={{
                  mr: listItemRef.current?.classList.contains(
                    "MuiListItem-dense",
                  )
                    ? "-15px"
                    : "",
                }}
              >
                <MoreHorizIcon />
              </IconButton>
            }
            disablePadding
          >
            <ListItemButton
              onClick={() => onItemClick(metadataDetails)}
              selected={isActive}
            >
              <ListItemIcon>
                {
                  <Avatar
                    alt={metadataDetails.name}
                    src={thumbnailImage}
                    variant={"square"}
                    sx={{ mr: ".5rem" }}
                  />
                }
              </ListItemIcon>

              <ListItemText
                primary={metadataDetails.name}
                primaryTypographyProps={{ noWrap: true }}
              />
              {annotationCount !== 0 ? (
                <Chip label={annotationCount} size="small" />
              ) : undefined}
            </ListItemButton>
          </ListItem>
        </span>
      </Tooltip>
    );
  },
);
