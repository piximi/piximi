export enum DimensionOrder {
  YXC = "YXC", //greyscale or RGB image
  ZYXC = "ZYXC", //z-stack with greyscale or RGB image
  CYX = "CYX", //multi-channel image, e.g. 5 channels
  //future: ZCYX
}
