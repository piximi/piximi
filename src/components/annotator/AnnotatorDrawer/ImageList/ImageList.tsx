import React from "react";
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

const NUM_IMS_SHOWN = 5;

export const ImageList = ({
  images,
  activeImage,
  numStagedAnnotations,
}: ImageListProps) => {
  const dispatch = useDispatch();

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
            <ListItemButton
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
            </ListItemButton>
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
