import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { applicationSettingsSlice } from "store/slices/applicationSettings";

import { dataSlice } from "store/slices/data";
import { newDataSlice } from "store/slices/newData/newDataSlice";
import { uploadImages } from "utils/common/image/upload";

import { getImageFileInformation, ImageShapeEnum } from "utils/common/image";

export const useUpload = (
  setOpenDimensionsDialogBox: (flag: boolean) => void,
  isUploadedFromAnnotator?: boolean
) => {
  const dispatch = useDispatch();

  return useCallback(
    async (files: FileList) => {
      const imageShapeInfo = await getImageFileInformation(files[0]);

      if (
        [ImageShapeEnum.SingleRGBImage, ImageShapeEnum.GreyScale].includes(
          imageShapeInfo.shape
        )
      ) {
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
            newDataSlice.actions.addThings({
              things: res.imagesToUpload,
              isPermanent: true,
            })
          );
        }
        dispatch(
          dataSlice.actions.uploadImages({
            files: files,
            channels: imageShapeInfo.shape === ImageShapeEnum.GreyScale ? 1 : 3,
            slices: 1,
            referenceShape: imageShapeInfo,
            isUploadedFromAnnotator: isUploadedFromAnnotator,
          })
        );
      } else if (imageShapeInfo.shape === ImageShapeEnum.DicomImage) {
        dispatch(
          dataSlice.actions.uploadImages({
            files: files,
            channels: 1,
            slices: 1,
            referenceShape: imageShapeInfo,
            isUploadedFromAnnotator: isUploadedFromAnnotator,
          })
        );
      } else if (imageShapeInfo.shape === ImageShapeEnum.HyperStackImage) {
        setOpenDimensionsDialogBox(true);
      } else if (imageShapeInfo.shape === ImageShapeEnum.InvalidImage) {
        process.env.NODE_ENV !== "production" &&
          console.warn(
            "Could not get shape information from first image in file list"
          );
      } else {
        process.env.NODE_ENV !== "production" &&
          console.warn("Unrecognized ImageShapeEnum value");
      }

      return imageShapeInfo;
    },
    [dispatch, isUploadedFromAnnotator, setOpenDimensionsDialogBox]
  );
};
