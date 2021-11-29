import React from "react";
import Menu from "@mui/material/Menu";
import MenuList from "@mui/material/MenuList";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import { useDispatch, useSelector } from "react-redux";
import { imageViewerSlice } from "../../../../store/slices";
import { useTranslation } from "../../../../hooks/useTranslation";
import { activeImageIdSelector } from "../../../../store/selectors/activeImageIdSelector";
import {
  saveAnnotationsAsLabelMatrix,
  saveAnnotationsAsLabeledSemanticSegmentationMasks,
  saveAnnotationsAsBinaryInstanceSegmentationMasks,
} from "../../../../image/imageHelper";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import { categoriesSelector } from "../../../../store/selectors";
import { imagesSelector } from "../../../../store/selectors/imagesSelector";
import { ImageViewerImage } from "../../../../types/ImageViewerImage";
import { Divider } from "@mui/material";
import { Image } from "../../../../types/Image";

type ImageMenuProps = {
  anchorElImageMenu: any;
  onCloseImageMenu: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
  openImageMenu: boolean;
};

export const ImageMenu = ({
  anchorElImageMenu,
  onCloseImageMenu,
  openImageMenu,
}: ImageMenuProps) => {
  const dispatch = useDispatch();
  const currentImageId = useSelector(activeImageIdSelector);
  const categories = useSelector(categoriesSelector);
  const images = useSelector(imagesSelector);

  const onClearAnnotationsClick = (
    event: React.MouseEvent<HTMLElement, MouseEvent>
  ) => {
    if (!currentImageId) return;
    dispatch(
      imageViewerSlice.actions.deleteAllImageInstances({
        imageId: currentImageId,
      })
    );
    onCloseImageMenu(event);
  };

  const onDeleteImage = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
    if (!currentImageId) return;
    dispatch(imageViewerSlice.actions.deleteImage({ id: currentImageId }));
    onCloseImageMenu(event);
  };

  const onExportLabeledInstanceMasks = (
    event: React.MouseEvent<HTMLElement, MouseEvent>
  ) => {
    setAnchorEl(null);
    onCloseImageMenu(event);

    let zip = new JSZip();

    const activeImage = images.find((image: Image) => {
      return image.id === currentImageId;
    });

    if (!activeImage) return;

    Promise.all(
      saveAnnotationsAsLabelMatrix([activeImage], categories, zip, true)
    ).then(() => {
      zip.generateAsync({ type: "blob" }).then((blob) => {
        saveAs(blob, "labeled_instances.zip");
      });
    });
  };

  const onExportBinaryInstanceMasks = (
    event: React.MouseEvent<HTMLElement, MouseEvent>
  ) => {
    setAnchorEl(null);
    onCloseImageMenu(event);

    let zip = new JSZip();

    const activeImage = images.find((image: Image) => {
      return image.id === currentImageId;
    });

    if (!activeImage) return;

    saveAnnotationsAsBinaryInstanceSegmentationMasks(
      [activeImage],
      categories,
      zip
    );
  };

  const onExportLabels = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
    setAnchorEl(null);
    onCloseImageMenu(event);

    let zip = new JSZip();

    const activeImage = images.find((image: Image) => {
      return image.id === currentImageId;
    });

    if (!activeImage) return;

    Promise.all(
      saveAnnotationsAsLabelMatrix([activeImage], categories, zip)
    ).then(() => {
      zip.generateAsync({ type: "blob" }).then((blob) => {
        saveAs(blob, "labels.zip");
      });
    });
  };

  const onExportLabeledSemanticMasks = (
    event: React.MouseEvent<HTMLElement, MouseEvent>
  ) => {
    setAnchorEl(null);
    onCloseImageMenu(event);

    let zip = new JSZip();

    const activeImage = images.find((image: Image) => {
      return image.id === currentImageId;
    });

    if (!activeImage) return;

    saveAnnotationsAsLabeledSemanticSegmentationMasks(
      [activeImage],
      categories,
      zip
    );
  };

  const onExportBinarySemanticMasks = (
    event: React.MouseEvent<HTMLElement, MouseEvent>
  ) => {
    setAnchorEl(null);
    onCloseImageMenu(event);

    let zip = new JSZip();

    const activeImage = images.find((image: Image) => {
      return image.id === currentImageId;
    });

    if (!activeImage) return;

    Promise.all(
      saveAnnotationsAsLabelMatrix(images, categories, zip, false, true)
    ).then(() => {
      zip.generateAsync({ type: "blob" }).then((blob) => {
        saveAs(blob, "binary_semantic.zip");
      });
    });
  };

  const t = useTranslation();

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLLIElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Menu
      anchorEl={anchorElImageMenu}
      anchorOrigin={{ horizontal: "center", vertical: "bottom" }}
      // getContentAnchorEl={null}
      onClose={onCloseImageMenu}
      open={openImageMenu}
      transformOrigin={{ horizontal: "center", vertical: "top" }}
    >
      <MenuList dense variant="menu">
        <div>
          <MenuItem onClick={handleClick}>Export annotations as</MenuItem>
          <Menu
            id="save-annotations-as-menu"
            anchorEl={anchorEl}
            keepMounted
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuList dense variant="menu">
              <div>
                <MenuItem onClick={onExportLabeledInstanceMasks}>
                  <Typography variant="inherit">
                    {t("Labeled instance masks")}
                  </Typography>
                </MenuItem>
                <MenuItem onClick={onExportBinaryInstanceMasks}>
                  <Typography variant="inherit">
                    {t("Binary instance masks")}
                  </Typography>
                </MenuItem>
                <MenuItem onClick={onExportLabeledSemanticMasks}>
                  <Typography variant="inherit">
                    {t("Labeled semantic masks")}
                  </Typography>
                </MenuItem>
                <MenuItem onClick={onExportBinarySemanticMasks}>
                  <Typography variant="inherit">
                    {t("Binary semantic masks")}
                  </Typography>
                </MenuItem>
                <MenuItem onClick={onExportLabels}>
                  <Typography variant="inherit">
                    {t("Label matrices")}
                  </Typography>
                </MenuItem>
              </div>
            </MenuList>
          </Menu>
          <Divider />
          <MenuItem onClick={onClearAnnotationsClick}>
            <Typography variant="inherit">{t("Clear Annotations")}</Typography>
          </MenuItem>
          <MenuItem onClick={onDeleteImage}>
            <Typography variant="inherit">{t("Delete Image")}</Typography>
          </MenuItem>
        </div>
      </MenuList>
    </Menu>
  );
};
