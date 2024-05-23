//@ts-nocheck
import * as ImageJS from "image-js";

export const theThing = (mask, shape) => {
  const maskImage = new ImageJS.Image(shape.width, shape.height, mask, {
    colorModel: "GREY" as ImageJS.ColorModel,
    components: 1,
    alpha: 0,
  });
  const maskROIManager = maskImage.getRoiManager();
  const maskRoiManager = maskROIManager.fromMask(maskImage);
  const baseRois = maskRoiManager.getRois();
  const roi = baseRois.sort((a: any, b: any) => {
    return b.surface - a.surface;
  })[1];
  const roiIds = maskRoiManager.getRoiIds();
  maskRoiManager.mergeRois(roiIds);

  //const rois = maskRoiManager.getRois();
  //const result = rois[0].surface;
  //const roiImage = baseRois[0].getMask();

  return { image: maskImage, maskImage: roi.getMask() };
};
