import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  Avatar,
  Chip,
  IconButton,
  ListItem,
  ListItemAvatar,
  ListItemSecondaryAction,
  ListItemText,
} from "@mui/material";

import MoreHorizIcon from "@mui/icons-material/MoreHoriz";

import { useTranslation } from "hooks";

import { ImageMenu } from "../ImageMenu";

import { CollapsibleList } from "components/common/CollapsibleList";

import { imageSelector } from "store/common";
import {
  annotatorImagesSelector,
  activeImageSelector,
  setActiveImage,
  stagedAnnotationsSelector,
} from "store/image-viewer";

import { ImageType, ShadowImageType } from "types";

export const ImageList = () => {
  const dispatch = useDispatch();

  const activeImage = useSelector(activeImageSelector);

  const annotatorImages = useSelector(annotatorImagesSelector);
  const stagedAnnotations = useSelector(stagedAnnotationsSelector);

  const [imageAnchorEl, setImageAnchorEl] = React.useState<null | HTMLElement>(
    null
  );

  const [selectedImage, setSelectedImage] = React.useState<ShadowImageType>(
    activeImage!
  );

  const ImageItemClickHandler = (
    evt: React.MouseEvent<HTMLDivElement | HTMLButtonElement, MouseEvent>,
    image: ShadowImageType
  ) => {
    if (image.id !== activeImage!.id) {
      console.log("im true!");
      dispatch(
        setActiveImage({
          imageId: image.id,
          prevImageId: activeImage!.id,
          execSaga: true,
        })
      );
      setSelectedImage(image as ImageType);
    }
  };

  const ImageMenuOpenHandler = (
    event: React.MouseEvent<HTMLButtonElement>,
    image: ShadowImageType
  ) => {
    setImageAnchorEl(event.currentTarget);
    setSelectedImage(image as ImageType);
  };

  const onImageMenuClose = () => {
    setImageAnchorEl(null);
  };

  const t = useTranslation();

  return (
    <>
      <CollapsibleList closed dense primary={t("Images")}>
        {annotatorImages.map((image: ShadowImageType) => {
          return (
            <div key={image.id}>
              <ListItem
                button
                id={image.id}
                onClick={(evt: React.MouseEvent<HTMLDivElement, MouseEvent>) =>
                  ImageItemClickHandler(evt, image)
                }
                selected={image.id === activeImage?.id}
              >
                <ListItemAvatar>
                  <Avatar alt={image.name} src={image.src} variant={"square"} />
                </ListItemAvatar>
                <ListItemText
                  id={image.id}
                  primary={image.name}
                  primaryTypographyProps={{ noWrap: true }}
                />
                {((image.id !== activeImage?.id &&
                  image.annotations.length !== 0) ||
                  (image.id === activeImage?.id &&
                    stagedAnnotations.length !== 0)) && (
                  <Chip
                    label={
                      image.id === activeImage?.id
                        ? stagedAnnotations.length
                        : image.annotations.length
                    }
                    size="small"
                  />
                )}
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={(event) => ImageMenuOpenHandler(event, image)}
                  >
                    <MoreHorizIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            </div>
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
