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
  Pagination,
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

const NUM_IMS_SHOWN = 1000;

interface ImageListItemProps {
  image: ShadowImageType;
  isActive: boolean;
  onItemClick: (image: ShadowImageType) => void;
  numStagedAnnotations: number;
  onSecondaryClick: (target: HTMLElement, image: ShadowImageType) => void;
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
            onClick={(event) => onSecondaryClick(event.currentTarget, image)}
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

  const activeImageRef = React.useRef(activeImage);

  const [imageAnchorEl, setImageAnchorEl] = React.useState<null | HTMLElement>(
    null
  );

  const [selectedImage, setSelectedImage] = React.useState<ShadowImageType>(
    activeImage!
  );

  const [viewRange, setViewRange] = React.useState<{
    start: number;
    end: number;
  }>({ start: 0, end: NUM_IMS_SHOWN });

  const handlePagination = (evt: React.ChangeEvent<unknown>, page: number) => {
    setViewRange({
      start: (page - 1) * NUM_IMS_SHOWN,
      end: page * NUM_IMS_SHOWN,
    });
  };

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
        setSelectedImage(image);
        activeImageRef.current = image;
        console.log(activeImageRef.current.name);
        console.log(activeImageRef.current.id);
      }
    },
    [dispatch, setSelectedImage]
  );

  const handleImageMenuOpen = React.useCallback(
    (target: HTMLElement, image: ShadowImageType) => {
      setImageAnchorEl(target);
      setSelectedImage(image);
    },
    [setImageAnchorEl, setSelectedImage]
  );

  const onImageMenuClose = () => {
    setImageAnchorEl(null);
  };

  const t = useTranslation();

  return (
    <>
      <CollapsibleList closed dense primary={t("Images")}>
        <Pagination
          count={Math.ceil(images.length / NUM_IMS_SHOWN)}
          onChange={handlePagination}
          boundaryCount={0}
          siblingCount={1}
          size={"small"}
          hidePrevButton
          hideNextButton
          showFirstButton
          showLastButton
          hidden={images.length <= NUM_IMS_SHOWN}
        />
        {images.slice(viewRange.start, viewRange.end).map((image) => {
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
        <ImageMenu
          anchorElImageMenu={imageAnchorEl}
          selectedImage={selectedImage}
          onCloseImageMenu={onImageMenuClose}
          openImageMenu={Boolean(imageAnchorEl)}
        />
      </CollapsibleList>
    </>
  );
};
