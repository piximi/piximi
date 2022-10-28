import "@tensorflow/tfjs-node";
import {
  scalar,
  Tensor,
  tensor2d,
  tensor4d,
  Tensor3D,
  Tensor4D,
  tidy,
} from "@tensorflow/tfjs";
import * as ImageJS from "image-js";

import {
  MIMEType,
  generateDefaultColors,
  loadImageAsStack,
  convertToTensor,
  getImageSlice,
  filterVisibleChannels,
  sliceVisibleChannels,
  sliceVisibleColors,
  generateColoredTensor,
  renderTensor,
  scaleColors,
  findMinMaxs,
  scaleImageTensor,
} from "image/utils/imageHelper";

// https://stackoverflow.com/questions/71365891/property-closeto-does-not-exist-on-type-expect
interface CustomMatchers<R = unknown> {
  closeTo(delta: number, value: number): R;
}

declare global {
  namespace jest {
    interface Expect extends CustomMatchers {}
  }
}

describe("color generation", () => {
  const ALL = [1, 1, 1];
  const RED = [1, 0, 0];
  const GREEN = [0, 1, 0];
  const BLUE = [0, 0, 1];
  const YELLOW = [1, 1, 0];
  const CYAN = [0, 1, 1];
  const MAGNETA = [1, 0, 1];

  const v = [0, 1 / 6, 2 / 6, 3 / 6, 4 / 6, 5 / 6, 1];
  // prettier-ignore
  let dummyTensor = tensor4d(
  [
    [[[v[0], v[0], v[1], v[1], v[0], v[6], v[2]], [v[6], v[3], v[4], v[5], v[0], v[6], v[3]]],
     [[v[0], v[1], v[2], v[1], v[0], v[6], v[2]], [v[6], v[4], v[5], v[5], v[0], v[6], v[3]]],
     [[v[0], v[2], v[3], v[1], v[0], v[6], v[2]], [v[6], v[5], v[6], v[5], v[0], v[6], v[3]]]]
    ,
    [[[v[1], v[6], v[0], v[0], v[1], v[5], v[2]], [v[3], v[6], v[6], v[6], v[1], v[5], v[3]]],
     [[v[1], v[6], v[0], v[0], v[1], v[5], v[2]], [v[4], v[6], v[6], v[6], v[1], v[5], v[3]]],
     [[v[2], v[6], v[0], v[0], v[1], v[5], v[2]], [v[5], v[6], v[6], v[6], v[1], v[5], v[3]]]]
  ], [2, 3, 2, 7], "float32");

  test("1 channel - greyscale", async () => {
    const [Z, H, W, C] = dummyTensor.shape;

    const inputTensor = tidy("getImageSlice", () => {
      const [grey, rest] = dummyTensor
        .slice([0], [1, H, W, C])
        // cast to 3D tensor
        .reshape([H, W, C])
        // split on channel axis resulting in 2 tensors
        // [H, W, 1] and [H, 2, 6]
        .split([1, 6], 2);

      return grey as Tensor3D;
    });

    const colors = await generateDefaultColors(inputTensor);

    const expectedColorData = [ALL];

    const expectedResult = {
      range: { 0: [0, 1] },
      visible: { 0: true },
      color: tensor2d(expectedColorData),
    };

    expect(colors.range).toEqual(expectedResult.range);
    expect(colors.visible).toEqual(expectedResult.visible);
    expect(colors.color.shape).toEqual(expectedResult.color.shape);
    expect(colors.color.dataSync()).toEqual(expectedResult.color.dataSync());

    colors.color.dispose();
    expectedResult.color.dispose();
  });

  test("3 channel - rgb", async () => {
    const [Z, H, W, C] = dummyTensor.shape;

    const inputTensor = tidy("getImageSlice", () => {
      const [rgb, rest] = dummyTensor
        .slice([0], [1, H, W, C])
        // cast to 3D tensor
        .reshape([H, W, C])
        // split on channel axis resulting in 2 tensors
        // [H, W, 3] and [H, 2, 3]
        .split([3, 4], 2);

      return rgb as Tensor3D;
    });

    const colors = await generateDefaultColors(inputTensor);

    const expectedColorData = [RED, GREEN, BLUE];

    const expectedResult = {
      range: {
        0: [0, 1],
        1: [0, expect.closeTo(5 / 6, 5)],
        2: [expect.closeTo(1 / 6, 5), 1],
      },
      visible: { 0: true, 1: true, 2: true },
      color: tensor2d(expectedColorData),
    };

    expect(colors.range).toEqual(expectedResult.range);
    expect(colors.visible).toEqual(expectedResult.visible);
    expect(colors.color.shape).toEqual(expectedResult.color.shape);
    expect(colors.color.dataSync()).toEqual(expectedResult.color.dataSync());

    colors.color.dispose();
    expectedResult.color.dispose();
  });

  test("shold have all colors for all channels, and first visible", async () => {
    const [Z, H, W, C] = dummyTensor.shape;

    const inputTensor = tidy("getImageSlice", () => {
      return (
        dummyTensor
          .slice([0], [1, H, W, C])
          // cast to 3D tensor
          .reshape([H, W, C]) as Tensor3D
      );
    });

    const colors = await generateDefaultColors(inputTensor);

    const expectedColorData = [RED, GREEN, BLUE, YELLOW, CYAN, MAGNETA, ALL];

    const expectedResult = {
      range: {
        0: [0, 1],
        1: [0, expect.closeTo(5 / 6, 5)],
        2: [expect.closeTo(1 / 6, 5), 1],
        3: [expect.closeTo(1 / 6, 5), expect.closeTo(5 / 6, 5)],
        4: [0, 0],
        5: [1, 1],
        6: [expect.closeTo(2 / 6, 5), expect.closeTo(3 / 6, 5)],
      },
      visible: {
        0: true,
        1: false,
        2: false,
        3: false,
        4: false,
        5: false,
        6: false,
      },
      color: tensor2d(expectedColorData),
    };

    expect(colors.range).toEqual(expectedResult.range);
    expect(colors.visible).toEqual(expectedResult.visible);
    expect(colors.color.shape).toEqual(expectedResult.color.shape);
    expect(colors.color.dataSync()).toEqual(expectedResult.color.dataSync());

    colors.color.dispose();
    expectedResult.color.dispose();
  });
});

describe("ImageJS Images -> Stacks -> Tensors ", () => {
  /*
  ======================
  Test Image Definitions
 */

  type PreloadedTestImages = {
    [key: string]: {
      filepath: string;
      width: number;
      height: number;
      bitDepth: number;
      frames: number;
      channels: number;
      slices: number;
      mimetype: MIMEType;
      data: undefined | File;
    };
  };

  type TestImages = PreloadedTestImages & { [key: string]: { data: File } };

  let testData: TestImages;

  const testDataUnloaded: PreloadedTestImages = {
    // binary images
    // TODO: image_data
    // binary: {
    //   filepath: "src/images/1c_1b_Neighborhood_watch_bw.png",
    //   width: 200,
    //   height: 140,
    //   bitDepth: 1,
    //   frames: 1,
    //   channels: 1,
    //   slices: 1,
    //   mimetype: "image/png",
    //   data: undefined,
    // },
    // 8 bit images
    greyScale: {
      filepath: "src/images/8b_1c_confocal-series_LUT.tif",
      width: 400,
      height: 400,
      bitDepth: 8,
      frames: 1,
      channels: 1,
      slices: 1,
      mimetype: "image/tiff",
      data: undefined,
    },
    rgb: {
      filepath: "src/images/8b_3c_rgb_neuron.tif",
      width: 512,
      height: 512,
      bitDepth: 8,
      frames: 3,
      channels: 3,
      slices: 1,
      mimetype: "image/tiff",
      data: undefined,
    },
    rgbComposite: {
      filepath: "src/images/8b_3c_composite_neuron.tif",
      width: 512,
      height: 512,
      bitDepth: 8,
      frames: 3,
      channels: 3,
      slices: 1,
      mimetype: "image/tiff",
      data: undefined,
    },
    rgba: {
      filepath: "src/images/contemplative-reptile.jpeg",
      width: 690,
      height: 388,
      bitDepth: 8,
      frames: 3,
      channels: 3,
      slices: 1,
      mimetype: "image/jpeg",
      data: undefined,
    },
    hyperStack2c: {
      filepath: "src/images/8b_2c_actin-nuclei.tif",
      width: 450,
      height: 450,
      bitDepth: 8,
      frames: 2,
      channels: 2,
      slices: 1,
      mimetype: "image/tiff",
      data: undefined,
    },
    hyperStack5c: {
      filepath: "src/images/8b_5c_rat_hippocampal_neuron.tif",
      width: 512,
      height: 512,
      bitDepth: 8,
      frames: 5,
      channels: 5,
      slices: 1,
      mimetype: "image/tiff",
      data: undefined,
    },
    hyperStack9z: {
      filepath: "src/images/9z_1c_8b_shorter_3d_monolayer_xy1_ch0.tif",
      width: 256,
      height: 256,
      bitDepth: 8,
      frames: 9,
      channels: 1,
      slices: 9,
      mimetype: "image/tiff",
      data: undefined,
    },
    hyperStack60z3c: {
      filepath: "src/images/60z_3c_8b_Test3DMultichannel.tif",
      width: 256,
      height: 256,
      bitDepth: 8,
      frames: 180,
      channels: 3,
      slices: 60,
      mimetype: "image/tiff",
      data: undefined,
    },
    // 16 bit images
    greyScale16b: {
      filepath: "src/images/16b_1c_happy_cell.tif",
      width: 250,
      height: 240,
      bitDepth: 16,
      frames: 1,
      channels: 1,
      slices: 1,
      mimetype: "image/tiff",
      data: undefined,
    },
    rgbComposite16b: {
      filepath: "src/images/16b_3c_nueron-composite.tif",
      width: 512,
      height: 512,
      bitDepth: 16,
      frames: 3,
      channels: 3,
      slices: 1,
      mimetype: "image/tiff",
      data: undefined,
    },
    hyperStack60z3c16b: {
      filepath: "src/images/60z_3c_16b_Test3DMultichannel.tif",
      width: 256,
      height: 256,
      bitDepth: 16,
      frames: 180,
      channels: 3,
      slices: 60,
      mimetype: "image/tiff",
      data: undefined,
    },
    // 32 bit float images
    // TODO: image_data
  };

  const fs = require("fs");

  for (const im of Object.keys(testDataUnloaded)) {
    const imProps = testDataUnloaded[im];
    const nameArr = imProps.filepath.split("/");
    const imName = nameArr[nameArr.length - 1];

    try {
      const bufferData: BlobPart = fs.readFileSync(imProps.filepath).buffer;

      const data = new File([bufferData], imName, { type: imProps.mimetype });

      // hacking node runtime File type to be more like browser File type
      data.arrayBuffer = () =>
        //@ts-ignore
        data[Object.getOwnPropertySymbols(data)[0]]._buffer;

      imProps.data = data;
    } catch (err) {
      console.error(err);
    }
  }

  testData = testDataUnloaded as TestImages;

  /*
    / Test Image Definitions
    ========================
   */

  it.each(Object.keys(testData))(
    "should load correct image stack and metadata - %s",
    async (im) => {
      const {
        width: expectedWidth,
        height: expectedHeight,
        bitDepth: expectedBitDepth,
        frames: expectedFrames,
      } = testData[im];

      const imageStack = await loadImageAsStack(testData[im].data);

      // is ImageJS.Stack (subclass of array, containing ImageJS.Image objects)
      // and correct number of ImageJS.Image objects
      expect(imageStack.length || false).toBe(expectedFrames);

      // each frame has correct properties
      imageStack.forEach((img) => {
        expect(img.width).toBe(expectedWidth);
        expect(img.height).toBe(expectedHeight);
        expect(img.bitDepth).toBe(expectedBitDepth);
        expect(img.channels).toBe(1);
        expect(img.components).toBe(1);
        expect(img.alpha).toBe(0);
        expect(img.size).toBe(expectedWidth * expectedHeight);
      });
    }
  );

  it.each(Object.keys(testData))(
    "should convert to tensor of correct shape and data - %s",
    async (im) => {
      const {
        width: expectedWidth,
        height: expectedHeight,
        bitDepth: expectedBitDepth,
        frames: expectedFrames,
        channels: expectedChannels,
        slices: expectedSlices,
      } = testData[im];

      expect(expectedChannels * expectedSlices).toBe(expectedFrames);

      const imageStack = await loadImageAsStack(testData[im].data);

      const imageTensor = convertToTensor(
        imageStack,
        expectedSlices,
        expectedChannels
      );

      const [axis0, axis1, axis2, axis3] = imageTensor.shape;

      expect(axis0).toBe(expectedSlices);
      expect(axis1).toBe(expectedHeight);
      expect(axis2).toBe(expectedWidth);
      expect(axis3).toBe(expectedChannels);

      const imageTensorInt = tidy(() => {
        return imageTensor
          .mul<Tensor4D>(scalar(2 ** expectedBitDepth - 1, "int32"))
          .round();
      });

      const imageTensorData = await imageTensorInt.array();

      // gc - no longer needed
      imageTensor.dispose();
      imageTensorInt.dispose();

      /*
        This test loops on each image, and below is a quad-loop for each.
        Calling expect in the innermost loop millions of times is super slow.

        Instead, build an array of differences between tensor data and image data,
        And check the sum is equal to 0 after.
       */
      const diffs: number[] = [];

      let frameIdx = 0;
      for (let sliceIdx = 0; sliceIdx < axis0; sliceIdx++) {
        for (let channelIdx = 0; channelIdx < axis3; channelIdx++) {
          let pixelIdx = 0;
          for (let rowIdx = 0; rowIdx < axis1; rowIdx++) {
            for (let colIdx = 0; colIdx < axis2; colIdx++) {
              diffs.push(
                imageTensorData[sliceIdx][rowIdx][colIdx][channelIdx] -
                  imageStack[frameIdx].data[pixelIdx]
              );
              pixelIdx++;
            }
          }
          frameIdx++;
        }
      }

      expect(diffs.reduce((partialSum, diff) => partialSum + diff, 0)).toBe(0);
    }
  );
});

describe("Tensor -> Composite Image", () => {
  const Z = 2;
  const H = 3;
  const W = 2;
  const C = 5;
  const BITDEPTH = 16;

  function normTensor<T extends Tensor>(tensor: T, bitDepth: number) {
    return tidy(() => {
      const res = tensor
        .mul<T>(scalar(2 ** bitDepth - 1))
        .round()
        .arraySync();
      tensor.dispose();
      return res;
    });
  }

  const stackData = [
    new Uint16Array([1111, 1121, 1211, 1221, 1311, 1321]),
    new Uint16Array([1112, 1122, 1212, 1222, 1312, 1322]),
    new Uint16Array([1113, 1123, 1213, 1223, 1313, 1323]),
    new Uint16Array([1114, 1124, 1214, 1224, 1314, 1324]),
    new Uint16Array([1115, 1125, 1215, 1225, 1315, 1325]),

    new Uint16Array([2111, 2121, 2211, 2221, 2311, 2321]),
    new Uint16Array([2112, 2122, 2212, 2222, 2312, 2322]),
    new Uint16Array([2113, 2123, 2213, 2223, 2313, 2323]),
    new Uint16Array([2114, 2124, 2214, 2224, 2314, 2324]),
    new Uint16Array([2115, 2125, 2215, 2225, 2315, 2325]),
  ];

  const imageStack = new ImageJS.Stack(
    stackData.map((imData, i) => {
      return new ImageJS.Image({
        width: W,
        height: H,
        data: stackData[i],
        kind: "GREY" as ImageJS.ImageKind,
        bitDepth: BITDEPTH as ImageJS.BitDepth,
        components: 1,
        alpha: 0,
        colorModel: "GREY" as ImageJS.ColorModel,
      });
    })
  );

  it("should create tensor - Image -> Tensor4D", async () => {
    // prettier-ignore
    let expectedTensorArray = 
    [
      [[[1111, 1112, 1113, 1114, 1115], [1121, 1122, 1123, 1124, 1125]],
       [[1211, 1212, 1213, 1214, 1215], [1221, 1222, 1223, 1224, 1225]],
       [[1311, 1312, 1313, 1314, 1315], [1321, 1322, 1323, 1324, 1325]]]
      ,
      [[[2111, 2112, 2113, 2114, 2115], [2121, 2122, 2123, 2124, 2125]],
       [[2211, 2212, 2213, 2214, 2215], [2221, 2222, 2223, 2224, 2225]],
       [[2311, 2312, 2313, 2314, 2315], [2321, 2322, 2323, 2324, 2325]]]
    ]

    const imageTensor = convertToTensor(imageStack, Z, C);

    expect(imageTensor.shape).toEqual([Z, H, W, C]);
    expect(imageTensor.rank).toBe(4);
    expect(normTensor(imageTensor, BITDEPTH)).toEqual(expectedTensorArray);
  });

  it("should slice tensor - Tensor4D -> Tensor3D", async () => {
    // prettier-ignore
    const expectedTensorArray = 
    [[[1111, 1112, 1113, 1114, 1115], [1121, 1122, 1123, 1124, 1125]],
     [[1211, 1212, 1213, 1214, 1215], [1221, 1222, 1223, 1224, 1225]],
     [[1311, 1312, 1313, 1314, 1315], [1321, 1322, 1323, 1324, 1325]]]

    const imageTensor = convertToTensor(imageStack, Z, C);
    const imageSlice = getImageSlice(imageTensor, 0);

    expect(imageSlice.shape).toEqual([H, W, C]);
    expect(imageSlice.rank).toBe(3);
    expect(normTensor(imageSlice, BITDEPTH)).toEqual(expectedTensorArray);
  });

  it("should filter visible channels from image tensor - Tensor4D -> Tensor3D", async () => {
    // c-1 because we will disable last channel
    const expectedC = C - 1;

    // prettier-ignore
    const expectedTensorArray = 
    [[[1111, 1112, 1113, 1114], [1121, 1122, 1123, 1124]],
     [[1211, 1212, 1213, 1214], [1221, 1222, 1223, 1224]],
     [[1311, 1312, 1313, 1314], [1321, 1322, 1323, 1324]]]

    const expectedVisibleChannels = [0, 1, 2, 3];

    const imageTensor = convertToTensor(imageStack, Z, C);
    const imageSlice = getImageSlice(imageTensor, 0);

    const colors = await generateDefaultColors(imageSlice);
    // set all channel visibility to true, except last
    colors.visible[0] = true;
    colors.visible[1] = true;
    colors.visible[2] = true;
    colors.visible[3] = true;
    colors.visible[4] = false;

    const visibleChannels = filterVisibleChannels(colors);
    const filteredSlice = sliceVisibleChannels(imageSlice, visibleChannels);

    expect(visibleChannels).toEqual(expectedVisibleChannels);
    expect(filteredSlice.rank).toBe(3);
    expect(filteredSlice.shape).toEqual([H, W, expectedC]);
    expect(normTensor(filteredSlice, BITDEPTH)).toEqual(expectedTensorArray);
  });

  it("should filter visible channels from image tensor - Tensor4D -> Tensor4D", async () => {
    // c-1 because we will disable last channel
    const expectedC = C - 1;

    // prettier-ignore
    const expectedTensorArray = 
    [
      [[[1111, 1112, 1113, 1114], [1121, 1122, 1123, 1124]],
       [[1211, 1212, 1213, 1214], [1221, 1222, 1223, 1224]],
       [[1311, 1312, 1313, 1314], [1321, 1322, 1323, 1324]]],

      [[[2111, 2112, 2113, 2114], [2121, 2122, 2123, 2124]],
       [[2211, 2212, 2213, 2214], [2221, 2222, 2223, 2224]],
       [[2311, 2312, 2313, 2314], [2321, 2322, 2323, 2324]]]
    ]

    const expectedVisibleChannels = [0, 1, 2, 3];

    const imageTensor = convertToTensor(imageStack, Z, C);

    const colors = await generateDefaultColors(imageTensor);
    // set all channel visibility to true, except last
    colors.visible[0] = true;
    colors.visible[1] = true;
    colors.visible[2] = true;
    colors.visible[3] = true;
    colors.visible[4] = false;

    const visibleChannels = filterVisibleChannels(colors);
    const filteredSlice = sliceVisibleChannels(imageTensor, visibleChannels);

    expect(visibleChannels).toEqual(expectedVisibleChannels);
    expect(filteredSlice.rank).toBe(4);
    expect(filteredSlice.shape).toEqual([Z, H, W, expectedC]);
    expect(normTensor(filteredSlice, BITDEPTH)).toEqual(expectedTensorArray);
  });

  it("should filter visible channels from color tensor", async () => {
    // c-1 because we will disable last channel
    const expectedC = C - 1;

    // prettier-ignore
    const expectedTensorArray =
      [[1, 0, 0],
       [0, 1, 0],
       [0, 0, 1],
       [1, 1, 0]];

    const expectedVisibleChannels = [0, 1, 2, 3];

    // prettier-ignore
    const inputTensorArray = 
    [
      [[[1111, 1112, 1113, 1114], [1121, 1122, 1123, 1124]],
       [[1211, 1212, 1213, 1214], [1221, 1222, 1223, 1224]],
       [[1311, 1312, 1313, 1314], [1321, 1322, 1323, 1324]]],

      [[[2111, 2112, 2113, 2114], [2121, 2122, 2123, 2124]],
       [[2211, 2212, 2213, 2214], [2221, 2222, 2223, 2224]],
       [[2311, 2312, 2313, 2314], [2321, 2322, 2323, 2324]]]
    ]

    const imageTensor = convertToTensor(imageStack, Z, C);

    const colors = await generateDefaultColors(imageTensor);
    // set all channel visibility to true, except last
    colors.visible[0] = true;
    colors.visible[1] = true;
    colors.visible[2] = true;
    colors.visible[3] = true;
    colors.visible[4] = false;

    const visibleChannels = filterVisibleChannels(colors);
    const filteredColors = sliceVisibleColors(colors, visibleChannels);
    const filteredColorsArray = await filteredColors.array();
    filteredColors.dispose();

    expect(visibleChannels).toEqual(expectedVisibleChannels);
    expect(filteredColors.rank).toBe(2);
    expect(filteredColors.shape).toEqual([expectedC, 3]);
    expect(filteredColorsArray).toEqual(expectedTensorArray);
  });

  it("should apply colors - [H, W, C] -> [H, W, 3]", async () => {
    // prettier-ignore
    const expectedTensorArray =
      [[[1111+1114, 1112+1114, 1113], [1121+1124, 1122+1124, 1123]],
       [[1211+1214, 1212+1214, 1213], [1221+1224, 1222+1224, 1223]],
       [[1311+1314, 1312+1314, 1313], [1321+1324, 1322+1324, 1323]]]

    const imageTensor = convertToTensor(imageStack, Z, C);
    const imageSlice = getImageSlice(imageTensor, 0);

    const colors = await generateDefaultColors(imageSlice);
    // set all channel visibility to true, except last
    colors.visible[0] = true;
    colors.visible[1] = true;
    colors.visible[2] = true;
    colors.visible[3] = true;
    colors.visible[4] = false;

    const visibleChannels = filterVisibleChannels(colors);
    const filteredSlice = sliceVisibleChannels(imageSlice, visibleChannels);
    const filteredColors = sliceVisibleColors(colors, visibleChannels);
    const compositeImage = generateColoredTensor(filteredSlice, filteredColors);

    expect(compositeImage.rank).toBe(3);
    expect(compositeImage.shape).toEqual([H, W, 3]);
    expect(normTensor(compositeImage, BITDEPTH)).toEqual(expectedTensorArray);
  });

  it("should apply colors - [Z, H, W, C] -> [Z, H, W, 3]", async () => {
    // prettier-ignore
    const expectedTensorArray =
      [
        [[[1111+1114, 1112+1114, 1113], [1121+1124, 1122+1124, 1123]],
         [[1211+1214, 1212+1214, 1213], [1221+1224, 1222+1224, 1223]],
         [[1311+1314, 1312+1314, 1313], [1321+1324, 1322+1324, 1323]]],

        [[[2111+2114, 2112+2114, 2113], [2121+2124, 2122+2124, 2123]],
         [[2211+2214, 2212+2214, 2213], [2221+2224, 2222+2224, 2223]],
         [[2311+2314, 2312+2314, 2313], [2321+2324, 2322+2324, 2323]]]
      ]

    const imageTensor = convertToTensor(imageStack, Z, C);

    const colors = await generateDefaultColors(imageTensor);
    // set all channel visibility to true, except last
    colors.visible[0] = true;
    colors.visible[1] = true;
    colors.visible[2] = true;
    colors.visible[3] = true;
    colors.visible[4] = false;

    const visibleChannels = filterVisibleChannels(colors);
    const filteredSlice = sliceVisibleChannels(imageTensor, visibleChannels);
    const filteredColors = sliceVisibleColors(colors, visibleChannels);
    const compositeImage = generateColoredTensor(filteredSlice, filteredColors);

    expect(compositeImage.rank).toBe(4);
    expect(compositeImage.shape).toEqual([Z, H, W, 3]);
    expect(normTensor(compositeImage, BITDEPTH)).toEqual(expectedTensorArray);
  });

  it("should clamp applied colors to bit depth", async () => {
    const Z = 1;
    const H = 3;
    const W = 2;
    const C = 4;
    const BITDEPTH = 8;

    // prettier-ignore
    const stackData = [
      new Uint16Array([  0,  50,
                       100, 150,
                       200, 250]),
      new Uint16Array([250, 200,
                       150, 100,
                        50,   0]),
      new Uint16Array([  0,   0,
                       128, 128,
                       255, 255]),
      new Uint16Array([128, 128,
                       128, 128,
                       128, 128,]),
    ];

    // prettier-ignore
    const expectedTensorArray =
      [[[128, 255,   0], [178, 255,   0]],
       [[228, 255, 128], [255, 228, 128]],
       [[255, 178, 255], [255, 128, 255]]]

    const imageStack = new ImageJS.Stack(
      stackData.map((imData, i) => {
        return new ImageJS.Image({
          width: W,
          height: H,
          data: stackData[i],
          kind: "GREY" as ImageJS.ImageKind,
          bitDepth: BITDEPTH as ImageJS.BitDepth,
          components: 1,
          alpha: 0,
          colorModel: "GREY" as ImageJS.ColorModel,
        });
      })
    );

    const imageTensor = convertToTensor(imageStack, Z, C);
    const imageSlice = getImageSlice(imageTensor, 0);

    const colors = await generateDefaultColors(imageSlice);
    colors.visible[0] = true;
    colors.visible[1] = true;
    colors.visible[2] = true;
    colors.visible[3] = true;

    const visibleChannels = filterVisibleChannels(colors);
    const filteredSlice = sliceVisibleChannels(imageSlice, visibleChannels);
    const filteredColors = sliceVisibleColors(colors, visibleChannels);
    const compositeImage = generateColoredTensor(filteredSlice, filteredColors);

    expect(normTensor(compositeImage, BITDEPTH)).toEqual(expectedTensorArray);
  });

  it("should scale channel ranges to min-max values - [H, W, C]", async () => {
    const MINS = [1111, 1112, 1113, 1114];
    const MAXS = [1321, 1322, 1323, 1324];

    const scale = (
      values: number[],
      mins: number[] = MINS,
      maxs: number[] = MAXS,
      bitDepth: number = BITDEPTH
    ) => {
      const scaledCh: number[] = [];

      for (let i = 0; i < 4; i++) {
        let value = values[i];
        let max = maxs[i];
        let min = mins[i];
        let range = max - min;

        scaledCh.push(((value - min) / range) * (2 ** bitDepth - 1));
      }

      return [
        Math.min(Math.round(scaledCh[0] + scaledCh[3]), 2 ** bitDepth - 1),
        Math.min(Math.round(scaledCh[1] + scaledCh[3]), 2 ** bitDepth - 1),
        Math.round(scaledCh[2]),
      ];
    };

    // prettier-ignore
    const expectedTensorArray =
      [[scale([1111, 1112, 1113, 1114]), scale([1121, 1122, 1123, 1124])],
       [scale([1211, 1212, 1213, 1214]), scale([1221, 1222, 1223, 1224])],
       [scale([1311, 1312, 1313, 1314]), scale([1321, 1322, 1323, 1324])]]

    const imageTensor = convertToTensor(imageStack, Z, C);
    const imageSlice = getImageSlice(imageTensor, 0);

    const colors = await generateDefaultColors(imageSlice);
    // set all channel visibility to true, except last
    colors.visible[0] = true;
    colors.visible[1] = true;
    colors.visible[2] = true;
    colors.visible[3] = true;
    colors.visible[4] = false;

    const [mins, maxs] = await findMinMaxs(imageSlice);
    scaleColors(colors, { mins, maxs });
    const scaledImageSlice = scaleImageTensor(imageSlice, colors);
    const visibleChannels = filterVisibleChannels(colors);
    const filteredSlice = sliceVisibleChannels(
      scaledImageSlice,
      visibleChannels
    );
    const filteredColors = sliceVisibleColors(colors, visibleChannels);
    const compositeImage = generateColoredTensor(filteredSlice, filteredColors);

    expect(compositeImage.rank).toBe(3);
    expect(compositeImage.shape).toEqual([H, W, 3]);
    expect(normTensor(compositeImage, BITDEPTH)).toEqual(expectedTensorArray);
  });

  it("should scale channel ranges to min-max values - [Z, H, W, C]", async () => {
    const MINS = [1111, 1112, 1113, 1114];
    const MAXS = [2321, 2322, 2323, 2324];

    const scale = (
      values: number[],
      mins: number[] = MINS,
      maxs: number[] = MAXS,
      bitDepth: number = BITDEPTH
    ) => {
      const scaledCh: number[] = [];

      for (let i = 0; i < 4; i++) {
        let value = values[i];
        let max = maxs[i];
        let min = mins[i];
        let range = max - min;

        scaledCh.push(((value - min) / range) * (2 ** bitDepth - 1));
      }

      return [
        Math.min(Math.round(scaledCh[0] + scaledCh[3]), 2 ** bitDepth - 1),
        Math.min(Math.round(scaledCh[1] + scaledCh[3]), 2 ** bitDepth - 1),
        Math.round(scaledCh[2]),
      ];
    };

    // prettier-ignore
    const expectedTensorArray =
      [
        [[scale([1111, 1112, 1113, 1114]), scale([1121, 1122, 1123, 1124])],
         [scale([1211, 1212, 1213, 1214]), scale([1221, 1222, 1223, 1224])],
         [scale([1311, 1312, 1313, 1314]), scale([1321, 1322, 1323, 1324])]],
        
        [[scale([2111, 2112, 2113, 2114]), scale([2121, 2122, 2123, 2124])],
         [scale([2211, 2212, 2213, 2214]), scale([2221, 2222, 2223, 2224])],
         [scale([2311, 2312, 2313, 2314]), scale([2321, 2322, 2323, 2324])]],
      ]

    const imageTensor = convertToTensor(imageStack, Z, C);

    const colors = await generateDefaultColors(imageTensor);
    // set all channel visibility to true, except last
    colors.visible[0] = true;
    colors.visible[1] = true;
    colors.visible[2] = true;
    colors.visible[3] = true;
    colors.visible[4] = false;

    const scaledImageSlice = scaleImageTensor(imageTensor, colors);
    const visibleChannels = filterVisibleChannels(colors);
    const filteredSlice = sliceVisibleChannels(
      scaledImageSlice,
      visibleChannels
    );
    const filteredColors = sliceVisibleColors(colors, visibleChannels);
    const compositeImage = generateColoredTensor(filteredSlice, filteredColors);

    expect(compositeImage.rank).toBe(4);
    expect(compositeImage.shape).toEqual([Z, H, W, 3]);
    expect(normTensor(compositeImage, BITDEPTH)).toEqual(expectedTensorArray);
  });

  it("should generate a correctly rendered 8 bit image", async () => {
    const Z = 2;
    const H = 3;
    const W = 2;
    const C = 5;
    const BITDEPTH = 8;
    const useCanvas = false;

    // prettier-ignore
    const expectedOutput = [
      255, 255, 255,
      255, 255, 255,
      255, 255, 255,
      255, 255, 255,
      255, 255, 255,
      255, 255, 255,
    ];

    const expectedImage = new ImageJS.Image({
      width: W,
      height: H,
      data: new Uint8Array(expectedOutput),
      kind: "RGB" as ImageJS.ImageKind,
      bitDepth: BITDEPTH as ImageJS.BitDepth,
      components: 3,
      alpha: 0,
      colorModel: "RGB" as ImageJS.ColorModel,
    });

    const expectedDataURL = expectedImage.toDataURL("image/png", {
      useCanvas,
    });

    const stackData = [
      new Uint16Array([65535, 65535, 65535, 65535, 65535, 65535]),
      new Uint16Array([65535, 65535, 65535, 65535, 65535, 65535]),
      new Uint16Array([65535, 65535, 65535, 65535, 65535, 65535]),
      new Uint16Array([65535, 65535, 65535, 65535, 65535, 65535]),
      new Uint16Array([65535, 65535, 65535, 65535, 65535, 65535]),

      new Uint16Array([65535, 65535, 65535, 65535, 65535, 65535]),
      new Uint16Array([65535, 65535, 65535, 65535, 65535, 65535]),
      new Uint16Array([65535, 65535, 65535, 65535, 65535, 65535]),
      new Uint16Array([65535, 65535, 65535, 65535, 65535, 65535]),
      new Uint16Array([65535, 65535, 65535, 65535, 65535, 65535]),
    ];

    const imageStack = new ImageJS.Stack(
      stackData.map((imData, i) => {
        return new ImageJS.Image({
          width: W,
          height: H,
          data: stackData[i],
          kind: "GREY" as ImageJS.ImageKind,
          bitDepth: BITDEPTH as ImageJS.BitDepth,
          components: 1,
          alpha: 0,
          colorModel: "GREY" as ImageJS.ColorModel,
        });
      })
    );

    const imageTensor = convertToTensor(imageStack, Z, C);
    const imageSlice = getImageSlice(imageTensor, 0);

    const colors = await generateDefaultColors(imageSlice);
    colors.visible[0] = true;
    colors.visible[1] = true;
    colors.visible[2] = true;
    colors.visible[3] = true;
    colors.visible[4] = true;

    const visibleChannels = filterVisibleChannels(colors);
    const filteredSlice = sliceVisibleChannels(imageSlice, visibleChannels);
    const filteredColors = sliceVisibleColors(colors, visibleChannels);
    const compositeImage = generateColoredTensor(filteredSlice, filteredColors);
    const renderedURL = await renderTensor(compositeImage, BITDEPTH, {
      useCanvas,
    });

    const image = await ImageJS.Image.load(renderedURL);
    const imageData = Array.from(image.data);

    expect(renderedURL).toBe(expectedDataURL);
    expect(imageData).toEqual(expectedOutput);
  });

  it("should generate a stack of correctly rendered 8 bit images", async () => {
    const Z = 2;
    const H = 3;
    const W = 2;
    const C = 5;
    const BITDEPTH = 8;
    const useCanvas = false;

    // prettier-ignore
    const expectedOutput = [
      255, 255, 255,
      255, 255, 255,
      255, 255, 255,
      255, 255, 255,
      255, 255, 255,
      255, 255, 255,
    ];

    const expectedImage = new ImageJS.Image({
      width: W,
      height: H,
      data: new Uint8Array(expectedOutput),
      kind: "RGB" as ImageJS.ImageKind,
      bitDepth: BITDEPTH as ImageJS.BitDepth,
      components: 3,
      alpha: 0,
      colorModel: "RGB" as ImageJS.ColorModel,
    });

    const expectedDataURL = expectedImage.toDataURL("image/png", {
      useCanvas,
    });

    const stackData = [
      new Uint16Array([65535, 65535, 65535, 65535, 65535, 65535]),
      new Uint16Array([65535, 65535, 65535, 65535, 65535, 65535]),
      new Uint16Array([65535, 65535, 65535, 65535, 65535, 65535]),
      new Uint16Array([65535, 65535, 65535, 65535, 65535, 65535]),
      new Uint16Array([65535, 65535, 65535, 65535, 65535, 65535]),

      new Uint16Array([65535, 65535, 65535, 65535, 65535, 65535]),
      new Uint16Array([65535, 65535, 65535, 65535, 65535, 65535]),
      new Uint16Array([65535, 65535, 65535, 65535, 65535, 65535]),
      new Uint16Array([65535, 65535, 65535, 65535, 65535, 65535]),
      new Uint16Array([65535, 65535, 65535, 65535, 65535, 65535]),
    ];

    const imageStack = new ImageJS.Stack(
      stackData.map((imData, i) => {
        return new ImageJS.Image({
          width: W,
          height: H,
          data: stackData[i],
          kind: "GREY" as ImageJS.ImageKind,
          bitDepth: BITDEPTH as ImageJS.BitDepth,
          components: 1,
          alpha: 0,
          colorModel: "GREY" as ImageJS.ColorModel,
        });
      })
    );

    const imageTensor = convertToTensor(imageStack, Z, C);

    const colors = await generateDefaultColors(imageTensor);
    colors.visible[0] = true;
    colors.visible[1] = true;
    colors.visible[2] = true;
    colors.visible[3] = true;
    colors.visible[4] = true;

    const visibleChannels = filterVisibleChannels(colors);
    const filteredSlice = sliceVisibleChannels(imageTensor, visibleChannels);
    const filteredColors = sliceVisibleColors(colors, visibleChannels);
    const compositeImage = generateColoredTensor(filteredSlice, filteredColors);
    const renderedURLs = await renderTensor(compositeImage, BITDEPTH, {
      useCanvas,
    });

    expect(renderedURLs.length).toBe(Z);

    for (let i = 0; i < renderedURLs.length; i++) {
      const image = await ImageJS.Image.load(renderedURLs[i]);
      const imageData = Array.from(image.data);

      expect(renderedURLs[i]).toBe(expectedDataURL);
      expect(imageData).toEqual(expectedOutput);
    }
  });

  it("should generate a correctly rendered 16 bit image", async () => {
    const Z = 2;
    const H = 3;
    const W = 2;
    const C = 5;
    const BITDEPTH = 16;
    const useCanvas = false;

    // prettier-ignore
    const expectedOutput = [
      65535, 65535, 65535,
      65535, 65535, 65535,
      65535, 65535, 65535,
      65535, 65535, 65535,
      65535, 65535, 65535,
      65535, 65535, 65535,
    ];

    const expectedImage = new ImageJS.Image({
      width: W,
      height: H,
      data: new Uint16Array(expectedOutput),
      kind: "RGB" as ImageJS.ImageKind,
      bitDepth: BITDEPTH as ImageJS.BitDepth,
      components: 3,
      alpha: 0,
      colorModel: "RGB" as ImageJS.ColorModel,
    });

    const expectedDataURL = expectedImage.toDataURL("image/png", {
      useCanvas,
    });

    const stackData = [
      new Uint16Array([65535, 65535, 65535, 65535, 65535, 65535]),
      new Uint16Array([65535, 65535, 65535, 65535, 65535, 65535]),
      new Uint16Array([65535, 65535, 65535, 65535, 65535, 65535]),
      new Uint16Array([65535, 65535, 65535, 65535, 65535, 65535]),
      new Uint16Array([65535, 65535, 65535, 65535, 65535, 65535]),

      new Uint16Array([65535, 65535, 65535, 65535, 65535, 65535]),
      new Uint16Array([65535, 65535, 65535, 65535, 65535, 65535]),
      new Uint16Array([65535, 65535, 65535, 65535, 65535, 65535]),
      new Uint16Array([65535, 65535, 65535, 65535, 65535, 65535]),
      new Uint16Array([65535, 65535, 65535, 65535, 65535, 65535]),
    ];

    const imageStack = new ImageJS.Stack(
      stackData.map((imData, i) => {
        return new ImageJS.Image({
          width: W,
          height: H,
          data: stackData[i],
          kind: "GREY" as ImageJS.ImageKind,
          bitDepth: BITDEPTH as ImageJS.BitDepth,
          components: 1,
          alpha: 0,
          colorModel: "GREY" as ImageJS.ColorModel,
        });
      })
    );

    const imageTensor = convertToTensor(imageStack, Z, C);
    const imageSlice = getImageSlice(imageTensor, 0);

    const colors = await generateDefaultColors(imageSlice);
    colors.visible[0] = true;
    colors.visible[1] = true;
    colors.visible[2] = true;
    colors.visible[3] = true;
    colors.visible[4] = true;

    const visibleChannels = filterVisibleChannels(colors);
    const filteredSlice = sliceVisibleChannels(imageSlice, visibleChannels);
    const filteredColors = sliceVisibleColors(colors, visibleChannels);
    const compositeImage = generateColoredTensor(filteredSlice, filteredColors);
    const renderedURL = await renderTensor(compositeImage, BITDEPTH, {
      useCanvas,
    });

    const image = await ImageJS.Image.load(renderedURL);
    const imageData = Array.from(image.data);

    expect(renderedURL).toBe(expectedDataURL);
    expect(imageData).toEqual(expectedOutput);
  });

  it("should garbage collect all but last tensors", async () => {
    const imageTensor = convertToTensor(imageStack, Z, C);
    const imageSlice = getImageSlice(imageTensor, 0);

    const colors = await generateDefaultColors(imageSlice);
    colors.visible[0] = true;
    colors.visible[1] = true;
    colors.visible[2] = true;
    colors.visible[3] = true;
    colors.visible[4] = true;

    const scaledImageSlice = scaleImageTensor(imageSlice, colors);
    const visibleChannels = filterVisibleChannels(colors);
    const filteredSlice = sliceVisibleChannels(
      scaledImageSlice,
      visibleChannels
    );
    const filteredColors = sliceVisibleColors(colors, visibleChannels);
    const compositeImage = generateColoredTensor(filteredSlice, filteredColors);
    const renderedURL = await renderTensor(compositeImage, BITDEPTH);

    // intermediary tensors should be disposed
    expect(imageSlice.isDisposed).toBe(true);
    expect(scaledImageSlice.isDisposed).toBe(true);
    expect(filteredSlice.isDisposed).toBe(true);
    expect(filteredColors.isDisposed).toBe(true);
    expect(compositeImage.isDisposed).toBe(true);
    // output tensors should not be disposed
    expect(imageTensor.isDisposed).toBe(false);
  });
});
