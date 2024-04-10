import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { applicationSettingsSlice } from "store/applicationSettings";

import { dataSlice } from "store/data/dataSlice";
import { ImageShapeEnum } from "utils/file-io/enums";
import { getImageFileInformation, uploadImages } from "utils/file-io/helpers";

export const useUpload = (
  setOpenDimensionsDialogBox: (flag: boolean) => void
) => {
  const dispatch = useDispatch();

  return useCallback(
    async (files: FileList) => {
      const imageShapeInfo = await getImageFileInformation(files[0]);

      switch (imageShapeInfo.shape) {
        case ImageShapeEnum.SingleRGBImage:
        case ImageShapeEnum.GreyScale: {
          const channels =
            imageShapeInfo.shape === ImageShapeEnum.GreyScale ? 1 : 3;
          const res = await uploadImages(files, channels, 1, imageShapeInfo);
          //HACK: Future plans to re-work error messages
          if (res.warning) {
            dispatch(
              applicationSettingsSlice.actions.updateAlertState({
                alertState: res.warning,
              })
            );
          } else if (res.errors.length) {
            dispatch(
              applicationSettingsSlice.actions.updateAlertState({
                alertState: res.errors[0],
              })
            );
          } else {
            dispatch(
              dataSlice.actions.addThings({
                things: res.imagesToUpload,
                isPermanent: true,
              })
            );
          }
          break;
        }
        case ImageShapeEnum.DicomImage: {
          const res = await uploadImages(files, 1, 1, imageShapeInfo);
          //HACK: Future plans to re-work error messages
          if (res.warning) {
            dispatch(
              applicationSettingsSlice.actions.updateAlertState({
                alertState: res.warning,
              })
            );
          } else if (res.errors.length) {
            dispatch(
              applicationSettingsSlice.actions.updateAlertState({
                alertState: res.errors[0],
              })
            );
          } else {
            dispatch(
              dataSlice.actions.addThings({
                things: res.imagesToUpload,
                isPermanent: true,
              })
            );
          }
          break;
        }
        case ImageShapeEnum.HyperStackImage:
          setOpenDimensionsDialogBox(true);
          break;
        case ImageShapeEnum.InvalidImage:
          process.env.NODE_ENV !== "production" &&
            console.warn(
              "Could not get shape information from first image in file list"
            );
          break;
        default:
          process.env.NODE_ENV !== "production" &&
            console.warn("Unrecognized ImageShapeEnum value");
      }

      return imageShapeInfo;
    },
    [dispatch, setOpenDimensionsDialogBox]
  );
};
