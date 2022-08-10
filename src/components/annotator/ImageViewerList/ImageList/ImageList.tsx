import React from "react";
import {
  Avatar,
  Chip,
  IconButton,
  ListItem,
  ListItemAvatar,
  ListItemSecondaryAction,
  ListItemText,
} from "@mui/material";
import { ImageType, ShadowImageType } from "types/ImageType";
import { CollapsibleList } from "../CollapsibleList";
import { ImageMenu } from "../ImageMenu";
import { useDispatch, useSelector } from "react-redux";
import { imageSelector } from "store/selectors";
import { annotatorImagesSelector } from "store/selectors/annotatorImagesSelector";
import { setActiveImage } from "store/slices";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { useTranslation } from "hooks/useTranslation";

export const ImageList = () => {
  const dispatch = useDispatch();

  const currentImage = useSelector(imageSelector);

  const annotatorImages = useSelector(annotatorImagesSelector);

  const [imageAnchorEl, setImageAnchorEl] = React.useState<null | HTMLElement>(
    null
  );

  const [selectedImage, setSelectedImage] = React.useState<ImageType>(
    currentImage!
  );

  const onImageItemClick = (
    evt: React.MouseEvent<HTMLDivElement | HTMLButtonElement, MouseEvent>,
    image: ShadowImageType
  ) => {
    dispatch(setActiveImage({ imageId: image.id }));
  };

  const onImageMenuOpen = (
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
                  onImageItemClick(evt, image)
                }
                selected={image.id === currentImage?.id}
              >
                <ListItemAvatar>
                  <Avatar alt={image.name} src={image.src} variant={"square"} />
                </ListItemAvatar>
                <ListItemText
                  id={image.id}
                  primary={image.name}
                  primaryTypographyProps={{ noWrap: true }}
                />
                {image.annotations.length !== 0 && (
                  <Chip label={image.annotations.length} size="small" />
                )}
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={(event) => onImageMenuOpen(event, image)}
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
