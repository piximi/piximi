import React from "react";
import { MenuItem } from "@mui/material";
import ListItemText from "@mui/material/ListItemText";
import { ImageShapeDialog } from "./ImageShapeDialog";
import { getImageShapeInformation, ImageShapeEnum } from "image/imageHelper";
import { applicationSlice } from "store/slices";
import { useDispatch } from "react-redux";

type OpenImageMenuItemProps = {
  popupState: any;
};

export const OpenImageMenuItem = ({ popupState }: OpenImageMenuItemProps) => {
  const dispatch = useDispatch();

  const [openDimensionsDialogBox, setOpenDimensionsDialogBox] =
    React.useState(false);

  const handleClose = () => {
    setOpenDimensionsDialogBox(false);
    popupState.close();
  };

  const [files, setFiles] = React.useState<FileList>();

  const onOpenImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.currentTarget.files) return;

    const files: FileList = Object.assign([], event.currentTarget.files);

    const imageShapeInfo = await getImageShapeInformation(files[0]);

    if (imageShapeInfo !== ImageShapeEnum.HyperStackImage) {
      dispatch(
        applicationSlice.actions.uploadImages({
          files: files,
          channels: 3,
          slices: 1,
          imageShapeInfo: imageShapeInfo,
          isUploadedFromAnnotator: true,
        })
      );
      popupState.close();
    } else {
      setOpenDimensionsDialogBox(true);
    }

    event.target.value = "";
    setFiles(files);
  };

  return (
    <React.Fragment>
      <MenuItem component="label">
        <ListItemText primary="Open new image" />
        <input
          accept="image/*"
          hidden
          multiple
          id="open-image"
          onChange={onOpenImage}
          type="file"
        />
      </MenuItem>
      <ImageShapeDialog
        files={files!}
        open={openDimensionsDialogBox}
        onClose={handleClose}
        isUploadedFromAnnotator={true}
      />
    </React.Fragment>
  );
};
