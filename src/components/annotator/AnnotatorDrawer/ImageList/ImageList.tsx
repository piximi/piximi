import React, { memo } from "react";
import { useDispatch } from "react-redux";

import {
  Avatar,
  Chip,
  IconButton,
  ListItemButton,
  ListItemAvatar,
  ListItemSecondaryAction,
  ListItemText,
  LinearProgress,
  Box,
} from "@mui/material";

import MoreHorizIcon from "@mui/icons-material/MoreHoriz";

import { useTranslation } from "hooks";

import { CollapsibleList } from "components/common/CollapsibleList";

import { ImageMenu } from "../ImageMenu";

import { setActiveImage } from "store/annotator";

import { ShadowImageType } from "types";

interface ImageListProps {
  images: Array<ShadowImageType>;
  activeImage: ShadowImageType;
  numStagedAnnotations: number;
}

const NUM_BUFFERED_IMS = 20;
const NUM_VIEW_IMS = Math.floor(NUM_BUFFERED_IMS / 2);

interface ImageListItemProps {
  image: ShadowImageType;
  isActive: boolean;
  onItemClick: (image: ShadowImageType) => void;
  numStagedAnnotations: number;
  onSecondaryClick: (target: HTMLElement) => void;
}

export const ImageListItem = memo(
  ({
    image,
    isActive,
    onItemClick,
    onSecondaryClick,
    numStagedAnnotations,
  }: ImageListItemProps) => {
    return (
      <ListItemButton
        key={image.id}
        id={image.id}
        onClick={() => onItemClick(image)}
        selected={isActive}
      >
        <ListItemAvatar>
          <Avatar alt={image.name} src={image.src} variant={"square"} />
        </ListItemAvatar>
        <ListItemText
          id={image.id}
          primary={image.name}
          primaryTypographyProps={{ noWrap: true }}
        />
        {((isActive && image.annotations.length !== 0) ||
          (isActive && numStagedAnnotations > 0)) && (
          <Chip
            label={isActive ? numStagedAnnotations : image.annotations.length}
            size="small"
          />
        )}
        <ListItemSecondaryAction>
          <IconButton
            edge="end"
            onClick={(event) => onSecondaryClick(event.currentTarget)}
          >
            <MoreHorizIcon />
          </IconButton>
        </ListItemSecondaryAction>
      </ListItemButton>
    );
  }
);

export const ImageList = ({
  images,
  activeImage,
  numStagedAnnotations,
}: ImageListProps) => {
  const dispatch = useDispatch();
  const t = useTranslation();

  const activeImageRef = React.useRef(activeImage);

  const [imageAnchorEl, setImageAnchorEl] = React.useState<null | HTMLElement>(
    null
  );

  const [bufferRange, setBufferRange] = React.useState({
    start: 0,
    end: NUM_BUFFERED_IMS,
  });

  const [scrollProgress, setScrollProgress] = React.useState(0);

  const handleImageItemClick = React.useCallback(
    (image: ShadowImageType) => {
      if (image.id !== activeImageRef.current.id) {
        dispatch(
          setActiveImage({
            imageId: image.id,
            prevImageId: activeImageRef.current.id,
            execSaga: true,
          })
        );
        activeImageRef.current = image;
      }
    },
    [dispatch]
  );

  const handleImageMenuOpen = React.useCallback(
    (target: HTMLElement) => {
      setImageAnchorEl(target);
    },
    [setImageAnchorEl]
  );

  const onImageMenuClose = () => {
    setImageAnchorEl(null);
  };

  const handleScroll = (evt: React.UIEvent<HTMLDivElement, UIEvent>) => {
    const target = evt.target as HTMLDivElement;

    if (
      target.scrollHeight - target.scrollTop === target.clientHeight &&
      bufferRange.end < images.length
    ) {
      const numToLoad = images.length - bufferRange.end;
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

      setScrollProgress((newEnd / images.length) * 100);

      target.scrollTop = 1;
    } else if (target.scrollTop === 0 && bufferRange.start !== 0) {
      const newStart = bufferRange.start - NUM_BUFFERED_IMS + NUM_VIEW_IMS - 1;
      const newEnd = bufferRange.end - NUM_BUFFERED_IMS + NUM_VIEW_IMS - 1;

      setBufferRange({
        start: newStart,
        end: newEnd,
      });

      setScrollProgress((newEnd / images.length) * 100);

      target.scrollTop = target.scrollHeight - target.clientHeight - 1;
    }
  };

  return (
    <>
      <Box
        display="grid"
        gridTemplateColumns="repeat(12, 1fr)"
        gridTemplateRows="1fr"
      >
        <Box gridColumn="1 / 13" gridRow="1 / 2">
          <CollapsibleList
            closed
            dense
            primary={t("Images")}
            sx={{
              height: `${3 * NUM_VIEW_IMS + 0.5}rem`,
              overflowY: "scroll",
              "::-webkit-scrollbar": { display: "none" },
            }}
            onScroll={handleScroll}
          >
            {images.slice(bufferRange.start, bufferRange.end).map((image) => {
              return (
                <ImageListItem
                  key={image.id}
                  image={image}
                  isActive={image.id === activeImage!.id}
                  onItemClick={handleImageItemClick}
                  numStagedAnnotations={numStagedAnnotations}
                  onSecondaryClick={handleImageMenuOpen}
                />
              );
            })}
          </CollapsibleList>
        </Box>

        <Box gridColumn="12 / 13" gridRow=" 1 / 2" justifyItems="flex-end">
          {images.length > NUM_BUFFERED_IMS && (
            <LinearProgress
              sx={{
                width: 4,
                height: `${3 * NUM_VIEW_IMS}rem`,
                marginTop: "3em",
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
        selectedImage={activeImageRef.current}
        onCloseImageMenu={onImageMenuClose}
        openImageMenu={Boolean(imageAnchorEl)}
      />
    </>
  );
};
