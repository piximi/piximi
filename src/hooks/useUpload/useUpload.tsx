import { useCallback } from "react";
import { useDispatch } from "react-redux";

import { applicationSlice } from "store/application";

import { getImageFileInformation, ImageShapeEnum } from "utils/common/image";

export const useUpload = (
  setOpenDimensionsDialogBox: (flag: boolean) => void,
  isUploadedFromAnnotator: boolean
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
        dispatch(
          applicationSlice.actions.uploadImages({
            files: files,
            channels: imageShapeInfo.shape === ImageShapeEnum.GreyScale ? 1 : 3,
            slices: 1,
            referenceShape: imageShapeInfo,
            isUploadedFromAnnotator: isUploadedFromAnnotator,
            execSaga: true,
          })
        );
      } else if (imageShapeInfo.shape === ImageShapeEnum.DicomImage) {
        dispatch(
          applicationSlice.actions.uploadImages({
            files: files,
            channels: 1,
            slices: 1,
            referenceShape: imageShapeInfo,
            isUploadedFromAnnotator: isUploadedFromAnnotator,
            execSaga: true,
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
