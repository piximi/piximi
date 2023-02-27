import React, { memo } from "react";
import { useDispatch } from "react-redux";

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

import { CollapsibleList } from "components/common/CollapsibleList";

import { ImageMenu } from "../ImageMenu";

import { setActiveImage } from "store/annotator";

import { ShadowImageType } from "types";

interface ImageListProps {
  images: Array<ShadowImageType>;
  activeImage: ShadowImageType;
  numStagedAnnotations: number;
}

// note: memoized to avoid rendering imageSrc constantly
export const ImageList = memo(
  ({ images, activeImage, numStagedAnnotations }: ImageListProps) => {
    const dispatch = useDispatch();

    const [imageAnchorEl, setImageAnchorEl] =
      React.useState<null | HTMLElement>(null);

    const [selectedImage, setSelectedImage] = React.useState<ShadowImageType>(
      activeImage!
    );

    const handleImageItemClick = (
      evt: React.MouseEvent<HTMLDivElement | HTMLButtonElement, MouseEvent>,
      image: ShadowImageType
    ) => {
      if (image.id !== activeImage!.id) {
        dispatch(
          setActiveImage({
            imageId: image.id,
            prevImageId: activeImage!.id,
            execSaga: true,
          })
        );
        setSelectedImage(image);
      }
    };

    const handleImageMenuOpen = (
      event: React.MouseEvent<HTMLButtonElement>,
      image: ShadowImageType
    ) => {
      setImageAnchorEl(event.currentTarget);
      setSelectedImage(image);
    };

    const onImageMenuClose = () => {
      setImageAnchorEl(null);
    };

    const t = useTranslation();

    return (
      <>
        <CollapsibleList closed dense primary={t("Images")}>
          {images.map((image) => {
            return (
              <ListItem
                button
                key={image.id}
                id={image.id}
                onClick={(evt: React.MouseEvent<HTMLDivElement, MouseEvent>) =>
                  handleImageItemClick(evt, image)
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
                    numStagedAnnotations !== 0)) && (
                  <Chip
                    label={
                      image.id === activeImage?.id
                        ? numStagedAnnotations
                        : image.annotations.length
                    }
                    size="small"
                  />
                )}
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={(event) => handleImageMenuOpen(event, image)}
                  >
                    <MoreHorizIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
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
  }
);
