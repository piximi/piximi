import type React from "react";
import { memo, useCallback, useState } from "react";

import { batch, useDispatch, useSelector } from "react-redux";

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
  Tooltip,
} from "@mui/material";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";

import { useRenderedSrc } from "hooks";

import {
  selectImageStackIds,
  selectActiveImageId,
} from "@ImageViewer/state/image-viewer-data/selectors";
import { useParameterizedSelector } from "store/hooks";
import {
  selectAnnotationsByImageId,
  selectExtendedImageByIds,
} from "store/data/selectors";
import type { ExtendedImageObject } from "store/data/types";
import { imageViewerDataSlice } from "@ImageViewer/state/image-viewer-data/imageViewerDataSlice";
import { annotatorSlice } from "@ImageViewer/state/annotator";

import { ImageMenu } from "./ImageMenu";

const NUM_BUFFERED_IMS = 20;
const NUM_VIEW_IMS = Math.floor(NUM_BUFFERED_IMS / 4);

interface ImageListItemProps {
  image: ExtendedImageObject;
  isActive: boolean;
  onItemClick: (image: ExtendedImageObject) => void;
  onSecondaryClick: (target: HTMLElement) => void;
}

export const ImageList = () => {
  const dispatch = useDispatch();
  const imageStackIds = useSelector(selectImageStackIds);

  const extendedImages = useParameterizedSelector(
    selectExtendedImageByIds,
    imageStackIds,
  );

  const [imageAnchorEl, setImageAnchorEl] = useState<null | HTMLElement>(null);
  const [bufferRange, setBufferRange] = useState({
    start: 0,
    end: NUM_BUFFERED_IMS,
  });
  const [scrollProgress, setScrollProgress] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const activeImageId = useSelector(selectActiveImageId);

  const handleImageItemClick = useCallback(
    (image: ExtendedImageObject) => {
      if (image.id !== activeImageId!) {
        batch(() => {
          dispatch(imageViewerDataSlice.actions.setActiveImageId(image.id));
          dispatch(annotatorSlice.actions.clearPendingOperation());
          dispatch(annotatorSlice.actions.setWorkingAnnotation(undefined));
        });
      }
    },
    [dispatch, activeImageId],
  );

  const handleImageMenuOpen = useCallback(
    (target: HTMLElement, imageIndex: number) => {
      setImageAnchorEl(target);
      setSelectedImageIndex(imageIndex);
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
      bufferRange.end < extendedImages.length
    ) {
      const numToLoad = extendedImages.length - bufferRange.end;
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

      setScrollProgress((newEnd / extendedImages.length) * 100);

      target.scrollTop = 1;
    } else if (target.scrollTop === 0 && bufferRange.start !== 0) {
      const newStart = bufferRange.start - NUM_BUFFERED_IMS + NUM_VIEW_IMS - 1;
      const newEnd = bufferRange.end - NUM_BUFFERED_IMS + NUM_VIEW_IMS - 1;

      setBufferRange({
        start: newStart,
        end: newEnd,
      });

      setScrollProgress((newEnd / extendedImages.length) * 100);

      target.scrollTop = target.scrollHeight - target.clientHeight - 1;
    }
  };

  return (
    <>
      <Box
        sx={{
          position: "relative",
          display: "flex",
          width: "100%",
          overflow: "hidden",
        }}
      >
        <List
          dense
          disablePadding
          component="div"
          sx={(theme) => ({
            maxHeight: `${3 * NUM_VIEW_IMS + 0.5}rem`,
            overflowY: "scroll",
            overflowX: "hidden",
            "::-webkit-scrollbar": { display: "none" },
            width: "100%",
            backgroundColor: theme.palette.background.paper,
          })}
          onScroll={handleScroll}
        >
          {extendedImages
            .slice(bufferRange.start, bufferRange.end)
            .map((image, idx) => {
              return (
                <ImageListItem
                  key={image.id}
                  image={image}
                  isActive={image.id === activeImageId}
                  onItemClick={handleImageItemClick}
                  onSecondaryClick={(event) =>
                    handleImageMenuOpen(event, bufferRange.start + idx)
                  }
                />
              );
            })}
        </List>

        <Box
          sx={{
            position: "absolute",
            right: 0,
            display: "flex",
            justifyItems: "flex-end",
          }}
        >
          {extendedImages.length > NUM_BUFFERED_IMS && (
            <LinearProgress
              sx={{
                width: 4,
                height: `${3 * NUM_VIEW_IMS}rem`,
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

      {extendedImages.length > 0 && (
        <ImageMenu
          anchorElImageMenu={imageAnchorEl}
          selectedImage={extendedImages[selectedImageIndex]}
          onCloseImageMenu={onImageMenuClose}
          openImageMenu={Boolean(imageAnchorEl)}
        />
      )}
    </>
  );
};
const ImageListItem = memo(
  ({ image, isActive, onItemClick, onSecondaryClick }: ImageListItemProps) => {
    const annotations = useParameterizedSelector(
      selectAnnotationsByImageId,
      image.id,
    );
    const { src } = useRenderedSrc(image.channelsRef);
    return (
      <Tooltip
        title={image.name}
        placement="right"
        disableInteractive={true}
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
                size={"medium"}
              >
                <MoreHorizIcon />
              </IconButton>
            }
            disablePadding
            sx={{
              width: "100%",
              "& .MuiListItemSecondaryAction-root": {
                right: "8px",
              },
              "& >.MuiListItemButton-root": {
                pr: "32px",
              },
            }}
          >
            <ListItemButton
              onClick={() => onItemClick(image)}
              selected={isActive}
              sx={{ px: 0, borderRadius: 0 }}
            >
              <ListItemIcon>
                {
                  <Avatar
                    alt={image.name}
                    src={src}
                    variant={"rounded"}
                    sx={{
                      mr: ".5rem",
                      ml: "0.25rem",
                      width: "35px",
                      height: "35px",
                    }}
                  />
                }
              </ListItemIcon>
              <ListItemText
                primary={image.name}
                slotProps={{ primary: { noWrap: true } }}
              />
              {annotations.length !== 0 ? (
                <Chip label={annotations.length} size="small" />
              ) : undefined}
            </ListItemButton>
          </ListItem>
        </span>
      </Tooltip>
    );
  },
);
