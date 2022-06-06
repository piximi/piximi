import { getImageShapeInformation, ImageShapeEnum } from "image/imageHelper";
import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { applicationSlice } from "store/slices";

export const useUpload = (
  setOpenDimensionsDialogBox: (flag: boolean) => void
) => {
  const dispatch = useDispatch();

  return useCallback(
    async (files: FileList) => {
      const imageShapeInfo = await getImageShapeInformation(files[0]);

      if (imageShapeInfo === ImageShapeEnum.SingleRGBImage) {
        dispatch(
          applicationSlice.actions.uploadImages({
            files: files,
            channels: 3,
            slices: 1,
            imageShapeInfo: imageShapeInfo,
            isUploadedFromAnnotator: false,
          })
        );
      } else if (imageShapeInfo === ImageShapeEnum.HyperStackImage) {
        setOpenDimensionsDialogBox(true);
      } else if (imageShapeInfo === ImageShapeEnum.InvalidImage) {
        process.env.NODE_ENV !== "production" &&
          console.warn(
            "Could not get shape information from first image in file list"
          );
      } else {
        process.env.NODE_ENV !== "production" &&
          console.warn("Unrecognized ImageShapeEnum value");
      }
    },
    [dispatch, setOpenDimensionsDialogBox]
  );
};
