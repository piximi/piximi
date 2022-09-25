import "@tensorflow/tfjs-node";
import { scalar, tensor2d, Tensor4D, tidy } from "@tensorflow/tfjs-node";
import * as ImageJS from "image-js";

import {
  MIMEType,
  generateDefaultChannels,
  loadImageAsStack,
  convertToTensor,
} from "image/utils/imageHelper";

describe("color generation", () => {
  const ALL = [1, 1, 1];
  const RED = [1, 0, 0];
  const GREEN = [0, 1, 0];
  const BLUE = [0, 0, 1];
  const YELLOW = [1, 1, 0];
  const CYAN = [0, 1, 1];
  const MAGNETA = [1, 0, 1];

  test("1 channel - greyscale", () => {
    const colors = generateDefaultChannels(1);

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

  test("3 channel - rgb", () => {
    const colors = generateDefaultChannels(3);

    const expectedColorData = [RED, GREEN, BLUE];

    const expectedResult = {
      range: { 0: [0, 1], 1: [0, 1], 2: [0, 1] },
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

  test("shold have all colors for all channels, and first visible", () => {
    const colors = generateDefaultChannels(7);

    const expectedColorData = [RED, GREEN, BLUE, YELLOW, CYAN, MAGNETA, ALL];

    const expectedResult = {
      range: {
        0: [0, 1],
        1: [0, 1],
        2: [0, 1],
        3: [0, 1],
        4: [0, 1],
        5: [0, 1],
        6: [0, 1],
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
    "should load proper image stack - %s",
    async (im) => {
      const {
        width: expectedWidth,
        height: expectedHeight,
        bitDepth: expectedBitDepth,
        frames: expectedFrames,
        // channels: expectedChannels,
        // slices: expectedSlices,
        // mimetype: expectedMimeType,
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
    "should convert to tensor of correct shape - %s",
    async (im) => {
      const {
        width: expectedWidth,
        height: expectedHeight,
        bitDepth: expectedBitDepth,
        // frames: expectedFrames,
        channels: expectedChannels,
        slices: expectedSlices,
        // mimetype: expectedMimeType,
      } = testData[im];

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
