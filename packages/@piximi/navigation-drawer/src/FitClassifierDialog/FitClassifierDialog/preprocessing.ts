import { Image } from './@piximi/types/dist';
//import { Image } from '/Users/fhubis/⁨piximi_tmp⁩/⁨tmp⁩/⁨@piximi⁩/types⁩/⁨dist⁩'
import { types } from 'util';
import * as ImageJS from 'image-js';
import * as tensorflow from '@tensorflow/tfjs';
import { imageRotateFlip } from './navigation-drawer/src/FitClassifierDialog/FitClassifierDialog/dataset';

/* 
 ############################### WIP #########################################
[ ] Check Syntax
[ ] Check data formats and passing
[ ] Add 'async', 'await', promises and resolving !
[ ] Call preprocessing function from FitClassifierDialog.tsx 
or [ ] Copy/paste  into loop in FitClassifierDialog.tsx: 
[ ] Compare equalization implementation (interpolation?)
[ ] Hook up interface buttons and dialog values with functions and function input

optional
[ ] get rid of hard code : number of pixels, uint8 values (256), equalization to full [0,255] spectrum
[ ] concatenate trainAndValidationImages and testImages to a single HTMLImageElement[][]

// ########################## Temporary: Reminder! #########################################
declare type Image = {
  categoryIdentifier: string;
  checksum: string;
  data: string;
  identifier: string;
  partition: Partition;
  scores: Score[];
  visualization: ImageVisualization;
};
*/

const createHistograms = (
  //  Calculates the histograms of each image and channel.
  //  ..and calculates the unified histogram of the greyscale images.
  // The unified histogram is given as the sum of the histograms of all images.
  trainAndValidationImages: HTMLImageElement[][],
  testImages: HTMLImageElement[][]
) => {
  let globalGreyHistogram: Array<number> = [];
  let tmpHistogram: Array<number> = [];
  let imageCounter: number = 0;
  let JSImage;
  let greyJSImage;

  // get and save histogram of single image:
  // loop over train/val set
  for (const imgSet of trainAndValidationImages) {
    for (const img of imgSet) {
      JSImage = ImageJS.Image.load(img.src);
      // From Image-JS doc: "Returns an array (number of channels) of array (number of slots)
      // ...containing the number of data of a specific intensity"
      greyJSImage = JSImage.grey();
      globalGreyHistogram += greyJSImage.getHistogram();
      imageCounter++;
    }
  }
  // same for the test set
  for (const imgSet of testImages) {
    for (const img of imgSet) {
      JSImage = ImageJS.Image.load(img.src);
      greyJSImage = JSImage.grey();
      globalGreyHistogram += greyJSImage.getHistogram();
      imageCounter++;
    }
  }
  return globalGreyHistogram;
};

export const getIntensitiesFromGlobalStatistics = (
  globalGreyHistogram: Array<number>,
  lowerPercentile: number,
  upperPercentile: number
) => {
  let cutoffCount: number[]; // [min, max]
  let MinMaxIntensities: number[]; // [min, max]
  // get total number of pixels
  let totalNumberOfPixels: number = 0;
  for (const bin of globalGreyHistogram) {
    totalNumberOfPixels += bin;
  }
  // get #pixels corresponding to percentiles
  cutoffCount = getUnifiedCutOffCount(
    totalNumberOfPixels,
    lowerPercentile,
    upperPercentile
  );
  // get min, max intensity of unified greyscale histogram corresponding to percentiles
  MinMaxIntensities = getMinMaxIntensities(cutoffCount, globalGreyHistogram);

  return MinMaxIntensities;
};

const getUnifiedCutOffCount = (
  totalNumberOfPixels: number,
  lowerPercentile: number,
  upperPercentile: number
) => {
  // Get pixel numbers corresponding to Percentiles
  let cutoffMinCount: number = Math.round(
    lowerPercentile * totalNumberOfPixels
  );
  let cutoffMaxCount: number = Math.round(
    upperPercentile * totalNumberOfPixels
  );
  // more precise: linear interpolation between ceil and floor:
  //*************************************************************************
  // let const minFloor: number = Math.floor(lowerPercentile * numberOfPixels);
  // let const minCeil: number = Math.ceil(lowerPercentile * numberOfPixels);
  // let const cutoffMinCount: number = minFloor + lowerPercentile * (minCeil-minFloor);

  // let const maxFloor: number = Math.floor(upperPercentile * numberOfPixels);
  // let const maxCeil: number = Math.ceil(upperPercentile * numberOfPixels);
  // let const cutoffMaxCount: number = maxFloor + lowerPercentile * (maxCeil-maxFloor);
  //*************************************************************************
  let cutoffCount: number[] = [cutoffMinCount, cutoffMaxCount];
  return cutoffCount;
};

const getMinMaxIntensities = (
  // Get intensities of corresponding pixels:
  // Find the intensity corresponding to the cutoffMinCount,
  //  ..by summation of the pixel count per bin (per intensity)
  //  ..starting from the low end.
  cutoffCount: number[], // [min,max]
  globalGreyHistogram: Array<number>
): number[] => {
  let MinMaxIntensity: number[] = [0, 255]; // init
  let growingPixelCount: number = 0;
  let shrinkingPixelCount: number = 255;

  let intensity = 0;
  while (growingPixelCount < cutoffCount[0]) {
    growingPixelCount += globalGreyHistogram[intensity];
    if (growingPixelCount >= cutoffCount[0]) {
      MinMaxIntensity[0] = intensity; //
    }
    intensity++;
  }
  intensity = 255;
  while (shrinkingPixelCount > cutoffCount[1]) {
    shrinkingPixelCount -= globalGreyHistogram[intensity];
    if (shrinkingPixelCount <= cutoffCount[1]) {
      MinMaxIntensity[1] = intensity;
    }
    intensity--;
  }
  return MinMaxIntensity; // [min,max]
};

export const desaturation = (
  /*
// Our desaturation is based on the statistics of the entire image set. 
// We calculate the pixel intensity histogram of the entire image set
//  ..by adding the histograms of all individual images after converting them to greyscale. 
// We then determine the max,min intensities for the given percentile range
// ..(lowerPercentile, upper Percentile) of the global histogram. 
// We then "clip the tails" of all histograms
//  ..by setting every pixel value < min to min 
//  ..and every value >max to max, respectively. 
//  We apply the clipping *separately* to every channel and every image,
// ..but based on the statistics of the *global* histogram.

Note that desaturation() will modify the images
  ... s.t. the individual and the global histogram are reshaped.
 The "tails" are cut, but the intensity counts spike 
  ... at minIntensity and maxIntensity. 
To distribute the counts from the margin across the entire intensity spectrum, 
  ... equalization can be applied, which stretches min/max to the entire range 
*/
  data: HTMLImageElement,
  MinMaxIntensities: number[],
  applyDesaturation: boolean
) => {
  if (!applyDesaturation) {
    // return image without modifications
    return data;
  }
  // otherwise apply desaturation and return modified image:
  let RgbIntensities: Array<number>; // RGB-intensities for one specific pixel
  let channel: number; // Red R -> 0, Green G -> 1, Blue B -> 2 [check!]
  let jsImage; // ToDo: Type declaration for js-image?
  // load
  jsImage = ImageJS.Image.load(data.src);
  // loop over pixels
  for (let x = 0; x < 224; x++) {
    // over x-coordinare fltr
    for (let y = 0; y < 224; y++) {
      // over y-coordinate from top to bottom
      RgbIntensities = jsImage.getPixelXY(x, y); // RGB values for specific (x,y) pixel

      // Loop over channels (rgb) of the (x,y)-pixel and clip if necessary.
      for (let channel = 0; channel < 3; channel++) {
        //Check: does rgb channel enumeration start with 0 ?
        if (RgbIntensities[channel] < MinMaxIntensities[0]) {
          // reset value to minIntensity if value < minIntensity
          jsImage.setValueXY(x, y, channel, MinMaxIntensities[0]);
        } else if (RgbIntensities[channel] > MinMaxIntensities[1]) {
          // reset value to maxIntensity if value > maxIntensity
          jsImage.setValueXY(x, y, channel, MinMaxIntensities[1]);
        }
      }
    }
  }
  // store to URL [check arguments and handling] !!
  data.src = jsImage.ToDataURL('image/png');
  return data;
};

export const equalization = async (
  // Histogram Equalization:
  // We transform a given histogram
  //  .. to a histogram of constant pixel count
  //  .. within a prespecified intensity range
  // See also https://en.wikipedia.org/wiki/Histogram_equalization
  data: HTMLImageElement,
  applyEqualizer: boolean
) => {
  if (!applyEqualizer) {
    // return image without modifications
    return data;
  }
  let RgbIntensities: Array<number>;
  let transformedRgbIntensities: Array<number>;
  let minIn: Array<number>;
  let maxIn: Array<number>;
  let jsImage; // type declaration for js-image?
  let jsHistograms: Array<Array<number>>;
  let minCount: number;
  let inPixelChannelValue: number;
  let outPixelChannelValue: number;
  let cumulatedPixelCount: number;
  let equation: number;
  // #################### HARD CODE ###################################
  const numberOfGreyLevels: number = 256; //full intensity spectrum
  const numberOfPixels: number = 224 * 224;
  // output intensity range. Optional: Implement s.t. user can set a range.
  const minOut: number = 0;
  const maxOut: number = numberOfGreyLevels - 1; // 255
  // ##################################################################
  // load
  jsImage = ImageJS.Image.load(data.src);
  // get histogram (for every channel)
  jsHistograms = jsImage.getHistograms();
  // get cumulative distribution function (for every channel)
  let cumulDist = getCumulDistributions(jsHistograms);
  // get min/max intensity values
  maxIn = jsImage.max(); //Returns an array with the maximal value of each channel
  minIn = jsImage.min();

  // loop over channels
  for (let channel = 0; channel < 3; channel++) {
    //Check: does rgb channel enumeration start with 0 ?
    minCount = jsHistograms[channel][minIn[channel]]; // get pixel count of smallest existing intensity for that channel
    // loop over pixels
    for (let x = 0; x < 224; x++) {
      // over x-coordinare fltr
      for (let y = 0; y < 224; y++) {
        // over y-coordinate from top to bottom
        // get intensity value of specific pixel channel
        inPixelChannelValue = jsImage.getValueXY(x, y, channel);
        // fetch cumulative intensity value from cumulative distribution
        cumulatedPixelCount = cumulDist[channel][inPixelChannelValue];
        // calculate transformed pixel value with histogram equalization equation
        equation =
          ((cumulatedPixelCount - minCount) / (numberOfPixels - minCount)) *
          (numberOfGreyLevels - 1); // cumulative distributions
        outPixelChannelValue = Math.round(equation);
        // overwrite existing pixel value
        jsImage.setValueXY(x, y, channel, outPixelChannelValue);
      }
    }
  }
  data.src = jsImage.ToDataURL('image/png');
  return data;
};

const getCumulDistributions = (
  // Calculates the cumulative distribution function (of each channel)
  //from the pixel intensity histogram (of each channel) :
  // Initializes the return arrays with the histogram arrays and then iterates over the intensities and channels.
  // To get the cumulative sum at Intensity "level+1" we simply add the cumul. sum from the previous level
  // (stored at 'level') to the bin 'level+1', that we initialized with the pixel count from the histogram.
  jsHistograms: Array<Array<number>>
): Array<Array<number>> => {
  let numberOfGreyLevels: number = 256;
  let cumulDist = jsHistograms;
  for (let level = 0; level < numberOfGreyLevels - 1; level++) {
    // level = 0,....,254
    for (let channel = 0; channel < 3; channel++) {
      cumulDist[channel][level + 1] += cumulDist[channel][level];
    }
  }
  return cumulDist;
};
const preprocessing = (
  trainAndValidationImages: HTMLImageElement[][],
  testImages: HTMLImageElement[][],
  MinMaxIntensities: number[],
  applyDesaturation: boolean,
  applyEqualizer: boolean
) => {
  // for all preprocessing
  // we load "Image-JS.Image" image from the HTML images (with img.src) for each preprocessing step separately
  // ... and store the modified images back to the img.src .
  // Modifications are done on the "Image-JS.Image" images.
  let data: HTMLImageElement;

  for (const imgSet of trainAndValidationImages) {
    for (data of imgSet) {
      // Call the preprocessing functions
      // which saves modified images to an URL internally
      // and outputs
      data = desaturation(data, MinMaxIntensities, applyDesaturation);
      data = equalization(data, applyEqualizer);
    }
  }
  // over test set
  for (const imgSet of testImages) {
    for (data of imgSet) {
      data = desaturation(data, MinMaxIntensities, applyDesaturation);
      data = equalization(data, applyEqualizer);
    }
  }
};

// ############################# Example pipeline ####################################
// inputs
let trainAndValidationImages: HTMLImageElement[][];
let testImages: HTMLImageElement[][];
let lowerPercentile: number;
let upperPercentile: number;
let applyDesaturation: boolean;
let applyEqualizer: boolean;
// variables
let globalGreyHistogram: Array<number> = [];
let MinMaxIntensities: number[];

// 1. Get histograms: loop over all images, load from URL, calculate histogram
// .... This function adds up and saves the histograms, however, the images are not modified (or saved).
globalGreyHistogram = createHistograms(trainAndValidationImages, testImages);

// 2. Calculate global greyscale intensity threshold (no loops needed)
MinMaxIntensities = getIntensitiesFromGlobalStatistics(
  globalGreyHistogram,
  lowerPercentile,
  upperPercentile
);

// 3. Open the second loop over images for preprocessing.
preprocessing(
  trainAndValidationImages,
  testImages,
  MinMaxIntensities,
  applyDesaturation,
  applyEqualizer
);

// ##################################################################################

// OLD
/*
import * as types from '@piximi/types';

export const rescaleData = async (
  lowerPercentile: number,
  upperPercentile: number,
  labeledData: types.Image[]
) => {
  // do something
  // old :const testDataSet = await createLabledTensorflowDataSet(testData, categories);
  let rescaledSet;
  return { rescaledSet };
};

export const resizeData = async (
  paddingOption1: boolean,
  paddingOption2: boolean,
  labeledData: types.Image[]
) => {
  // do something
  let resizedSet;
  return { resizedSet };
};

export const augmentData = async (
  dataAugmentation: boolean,
  labeledData: types.Image[]
) => {
  // do something
  // old :const testDataSet = await createLabledTensorflowDataSet(testData, categories);
  let augmentedSet;
  return { augmentedSet };
};
*/
