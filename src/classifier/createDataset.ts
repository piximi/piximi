//Old code from FitClassifier.tsx --> probably will be useful at some point

import seedrandom from "seedrandom";

const SEED_WORD = "testSuite";
const seed: seedrandom.prng = seedrandom(SEED_WORD);

// const BEAN_DATASET_URL =
//   "https://storage.googleapis.com/teachable-machine-models/test_data/image/beans/";
//
// const FLOWER_DATASET_URL =
//   "https://storage.googleapis.com/teachable-machine-models/test_data/image/flowers_all/";
//
// function loadPngImage(
//   c: string,
//   i: number,
//   dataset_url: string
// ): Promise<HTMLImageElement> {
//   // tslint:disable-next-line:max-line-length
//   const src = dataset_url + `${c}/${i}.png`;
//
//   // console.log(src)
//   return new Promise((resolve, reject) => {
//     const img = new Image();
//     img.onload = () => resolve(img);
//     img.onerror = reject;
//     img.crossOrigin = "anonymous";
//     img.src = src;
//   });
// }

// /**
//  * Create train/validation dataset and test dataset with unique images
//  */
// async function createDatasetsFromPiximiImages(
//   images: ImageType[],
//   classes: Category[]
// ) {
//   // fill in an array with unique numbers
//   let listNumbers = [];
//   let numberOfImages = images.length;
//   for (let i = 0; i < numberOfImages; ++i) listNumbers[i] = i;
//   listNumbers = fisherYates(listNumbers, seed); // shuffle
//
//   const trainAndValidationIndeces = listNumbers.slice(0, numberOfImages * 0.8);
//   const testIndices = listNumbers.slice(
//     numberOfImages * 0.8 + 1,
//     numberOfImages - 1
//   );
//
//   const trainAndValidationImages: HTMLImageElement[][] = [];
//   const testImages: HTMLImageElement[][] = [];
//
//   for (let j = 0; j < classes.length; ++j) {
//     let load: Array<HTMLImageElement> = [];
//     for (let i = 0; i < trainAndValidationIndeces.length; ++i) {
//       let imageIndex = trainAndValidationIndeces[i];
//       if (images[imageIndex].categoryId === classes[j].id) {
//         // load.push(await loadPiximiImage(images[imageIndex])); //FIXME uncomment
//       }
//     }
//     trainAndValidationImages.push(load);
//
//     load = [];
//     for (let i = 0; i < testIndices.length; ++i) {
//       let imageIndex = testIndices[i];
//       if (images[imageIndex].categoryId === classes[j].id) {
//         // load.push(await loadPiximiImage(images[imageIndex])); //FIXME uncomment
//       }
//     }
//     testImages.push(load);
//   }
//
//   return {
//     trainAndValidationImages,
//     testImages,
//   };
// }

/**
 * Shuffle an array of Float32Array or Samples using Fisher-Yates algorithm
 * Takes an optional seed value to make shuffling predictable
 */
function fisherYates(array: number[], seed?: seedrandom.prng) {
  const length = array.length;
  const shuffled = array.slice(0);
  for (let i = length - 1; i > 0; i -= 1) {
    let randomIndex;
    if (seed) {
      randomIndex = Math.floor(seed() * (i + 1));
    } else {
      randomIndex = Math.floor(Math.random() * (i + 1));
    }
    [shuffled[i], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[i]];
  }
  return shuffled;
}
//
// /**
//  * Output loss and accuracy results at the end of training
//  * Also evaluate the test dataset
//  */
// function showMetrics(
//   alpha: number,
//   time: number,
//   logs: tf.Logs[],
//   testAccuracy?: number
// ) {
//   const lastEpoch = logs[logs.length - 1];
//
//   const header = "α=" + alpha + ", t=" + (time / 1000).toFixed(1) + "s";
//
//   //FIXME bring that back
//   // const table = new Table({
//   //   head: [header, "Accuracy", "Loss"],
//   //   colWidths: [18, 10, 10],
//   // });
//   //FIXME bring that back
//   // table.push(
//   //   ["Train", lastEpoch.acc.toFixed(3), lastEpoch.loss.toFixed(5)],
//   //   ["Validation", lastEpoch.val_acc.toFixed(3), lastEpoch.val_loss.toFixed(5)]
//   // );
//   // console.log("\n" + table.toString());
// }
