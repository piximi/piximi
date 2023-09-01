import React, { memo } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Avatar, Chip, LinearProgress, Box } from "@mui/material";

import MoreHorizIcon from "@mui/icons-material/MoreHoriz";

import { useTranslation } from "hooks";

import { CollapsibleList } from "components/lists";

import { ImageMenu } from "components/menus";

import { selectActiveImageId, setActiveImageId } from "store/imageViewer";
import { selectTotalAnnotationCountByImage } from "store/data";

import { ImageType } from "types";
import { CustomListItemButton } from "components/list-items/CustomListItemButton";

const NUM_BUFFERED_IMS = 20;
const NUM_VIEW_IMS = Math.floor(NUM_BUFFERED_IMS / 2);

interface ImageListItemProps {
  image: ImageType;
  isActive: boolean;
  onItemClick: (image: ImageType) => void;
  onSecondaryClick: (target: HTMLElement) => void;
}

export const ImageList = ({ images }: { images: Array<ImageType> }) => {
  const dispatch = useDispatch();
  const t = useTranslation();

  const [imageAnchorEl, setImageAnchorEl] = React.useState<null | HTMLElement>(
    null
  );
  const [bufferRange, setBufferRange] = React.useState({
    start: 0,
    end: NUM_BUFFERED_IMS,
  });
  const [scrollProgress, setScrollProgress] = React.useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);

  const activeImageId = useSelector(selectActiveImageId);

  const handleImageItemClick = React.useCallback(
    (image: ImageType) => {
      if (image.id !== activeImageId!) {
        dispatch(
          setActiveImageId({
            imageId: image.id,
            prevImageId: activeImageId,
            execSaga: true,
          })
        );
      }
    },
    [dispatch, activeImageId]
  );

  const handleImageMenuOpen = React.useCallback(
    (target: HTMLElement, imageIndex: number) => {
      setImageAnchorEl(target);
      setSelectedImageIndex(imageIndex);
    },
    []
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
            closed={!images.length}
            dense
            primary={t("Images")}
            sx={{
              maxHeight: `${3 * NUM_VIEW_IMS + 0.5}rem`,
              overflowY: "scroll",
              "::-webkit-scrollbar": { display: "none" },
            }}
            onScroll={handleScroll}
            disabled={images.length === 0}
          >
            {images
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
        selectedImage={images[selectedImageIndex]}
        previousImageId={
          images.length > 1
            ? images[Math.abs(selectedImageIndex - 1)].id
            : undefined
        }
        onCloseImageMenu={onImageMenuClose}
        openImageMenu={Boolean(imageAnchorEl)}
      />
    </>
  );
};

const ImageListItem = memo(
  ({ image, isActive, onItemClick, onSecondaryClick }: ImageListItemProps) => {
    const annotationCount = useSelector((state) =>
      selectTotalAnnotationCountByImage(state, image.id)
    );
    return (
      <CustomListItemButton
        key={image.id}
        selected={isActive}
        onClick={() => onItemClick(image)}
        icon={
          <Avatar
            alt={image.name}
            src={image.src}
            variant={"square"}
            sx={{ mr: ".5rem" }}
          />
        }
        secondaryIcon={<MoreHorizIcon />}
        onSecondary={(event) => onSecondaryClick(event.currentTarget)}
        primaryText={image.name}
        tooltipText={image.name}
        additionalComponent={
          annotationCount !== 0 ? (
            <Chip label={annotationCount} size="small" />
          ) : undefined
        }
        primaryTypographyProps={{ noWrap: true }}
      />
    );
  }
);
