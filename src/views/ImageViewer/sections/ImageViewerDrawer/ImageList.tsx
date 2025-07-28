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

import { ImageMenu } from "./ImageMenu";

import { imageViewerSlice } from "views/ImageViewer/state/imageViewer";
import { selectActiveImageId } from "views/ImageViewer/state/imageViewer/selectors";
import { selectImageSeriesArray } from "views/ImageViewer/state/imageViewer/reselectors";

import { ImageObject } from "store/data/types";
import { getFullTimepointImage } from "store/data/utils";

const NUM_BUFFERED_IMS = 20;
const NUM_VIEW_IMS = Math.floor(NUM_BUFFERED_IMS / 4);

interface ImageListItemProps {
  image: ImageObject;
  isActive: boolean;
  onItemClick: (image: ImageObject) => void;
  onSecondaryClick: (target: HTMLElement) => void;
}

export const ImageList = () => {
  const dispatch = useDispatch();
  const imageSeriesArray = useSelector(selectImageSeriesArray);
  const activeImageId = useSelector(selectActiveImageId);

  const imageListImages = useMemo(() => {
    return imageSeriesArray.map((imageSeries) => {
      return getFullTimepointImage(imageSeries, "0");
    });
  }, [imageSeriesArray]);
  const [imageAnchorEl, setImageAnchorEl] = React.useState<null | HTMLElement>(
    null,
  );
  const [bufferRange, setBufferRange] = React.useState({
    start: 0,
    end: NUM_BUFFERED_IMS,
  });
  const [scrollProgress, setScrollProgress] = React.useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);

  const handleImageItemClick = React.useCallback(
    (image: ImageObject) => {
      if (image.id !== activeImageId!) {
        dispatch(
          imageViewerSlice.actions.setActiveImageSeriesId({
            imageId: image.id,
            prevImageId: activeImageId,
          }),
        );
      }
    },
    [dispatch, activeImageId],
  );

  const handleImageMenuOpen = React.useCallback(
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
      bufferRange.end < imageSeriesArray.length
    ) {
      const numToLoad = imageSeriesArray.length - bufferRange.end;
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

      setScrollProgress((newEnd / imageSeriesArray.length) * 100);

      target.scrollTop = 1;
    } else if (target.scrollTop === 0 && bufferRange.start !== 0) {
      const newStart = bufferRange.start - NUM_BUFFERED_IMS + NUM_VIEW_IMS - 1;
      const newEnd = bufferRange.end - NUM_BUFFERED_IMS + NUM_VIEW_IMS - 1;

      setBufferRange({
        start: newStart,
        end: newEnd,
      });

      setScrollProgress((newEnd / imageSeriesArray.length) * 100);

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
            {imageListImages
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
        </Box>
        <Box gridColumn="12 / 13" gridRow=" 1 / 2" justifyItems="flex-end">
          {imageSeriesArray.length > NUM_BUFFERED_IMS && (
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

      <ImageMenu
        anchorElImageMenu={imageAnchorEl}
        selectedImage={imageListImages[selectedImageIndex]}
        onCloseImageMenu={onImageMenuClose}
        openImageMenu={Boolean(imageAnchorEl)}
      />
    </Stack>
  );
};
const ImageListItem = memo(
  ({ image, isActive, onItemClick, onSecondaryClick }: ImageListItemProps) => {
    const annotationCount = image.containing.length;
    const listItemRef = useRef<HTMLLIElement | null>(null);
    return (
      <Tooltip
        title={image.name}
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
              onClick={() => onItemClick(image)}
              selected={isActive}
            >
              <ListItemIcon>
                {
                  <Avatar
                    alt={image.name}
                    src={image.src}
                    variant={"square"}
                    sx={{ mr: ".5rem" }}
                  />
                }
              </ListItemIcon>

              <ListItemText
                primary={image.name}
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
