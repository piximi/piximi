import {
  Dialog,
  DialogContent,
  DialogContentText,
  Tooltip,
  Button,
  List,
  ListItem,
  ListItemIcon,
  Collapse,
  ListItemText,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
} from "@material-ui/core";

import * as ImageJS from "image-js";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Typography from "@material-ui/core/Typography";
import Slider from "@material-ui/core/Slider";
import * as React from "react";
import { DialogAppBar } from "../DialogAppBar";
import { DialogTransition } from "../DialogTransition";
import { Form } from "../Form/Form";
import { RescalingForm } from "../RescalingForm/RescalingForm";
import { History } from "../History";
import classNames from "classnames";
import { makeStyles } from "@material-ui/styles";
import * as types from "@piximi/types";
import * as tensorflow from "@tensorflow/tfjs";
import { useState, useEffect } from "react";
import { styles } from "./FitClassifierDialog.css";
import { useCollapseList } from "@piximi/hooks";
import {
  createTrainingSet,
  assignToSet,
  setTestsetRatio,
  createAutotunerDataSet,
} from "./dataset";
import { rescaleData, resizeData, augmentData } from "./preprocessing";
import { createModel, createMobileNet } from "./networks";

// additional stuff to test
import * as tf from "@tensorflow/tfjs";
import seedrandom from "seedrandom";
import { assertTypesMatch } from "@tensorflow/tfjs-core/dist/tensor_util";

import * as tfvis from "@tensorflow/tfjs-vis";

const SEED_WORD = "testSuite";
const seed: seedrandom.prng = seedrandom(SEED_WORD);

const vis = tfvis.visor();
vis.close();
const surface = { name: "show.fitCallbacks", tab: "Training" };

// @ts-ignore
var Table = require("cli-table");

const BEAN_DATASET_URL =
  "https://storage.googleapis.com/teachable-machine-models/test_data/image/beans/";

const FLOWER_DATASET_URL =
  "https://storage.googleapis.com/teachable-machine-models/test_data/image/flowers_all/";

function loadPngImage(
  c: string,
  i: number,
  dataset_url: string
): Promise<HTMLImageElement> {
  // tslint:disable-next-line:max-line-length
  const src = dataset_url + `${c}/${i}.png`;

  // console.log(src)
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.crossOrigin = "anonymous";
    img.src = src;
  });
}

function loadPiximiImage(image: types.Image): HTMLImageElement {
  if (image.data.endsWith(".png")) {
    Promise.resolve(loadPiximiPngImage(image.data));
  }
  return getPiximiImage(image);
}

function getPiximiImage(image: types.Image) {
  const img = new Image(224, 224);
  img.crossOrigin = "anonymous";
  img.src = image.data;
  return img;
}

function loadPiximiPngImage(dataset_url: string): Promise<HTMLImageElement> {
  // tslint:disable-next-line:max-line-length
  const src = dataset_url;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.crossOrigin = "anonymous";
    img.src = src;
  });
}

/**
 * Create train/validation dataset and test dataset with unique images
 */
async function createDatasetsFromPiximiImages(
  images: types.Image[],
  classes: types.Category[]
) {
  // fill in an array with unique numbers
  let listNumbers = [];
  let numberOfImages = images.length;
  for (let i = 0; i < numberOfImages; ++i) listNumbers[i] = i;
  listNumbers = fisherYates(listNumbers, seed); // shuffle

  const trainAndValidationIndeces = listNumbers.slice(0, numberOfImages * 0.8);
  const testIndices = listNumbers.slice(
    numberOfImages * 0.8 + 1,
    numberOfImages - 1
  );

  const trainAndValidationImages: HTMLImageElement[][] = [];
  const testImages: HTMLImageElement[][] = [];

  for (let j = 0; j < classes.length; ++j) {
    let load: Array<HTMLImageElement> = [];
    for (let i = 0; i < trainAndValidationIndeces.length; ++i) {
      let imageIndex = trainAndValidationIndeces[i];
      if (images[imageIndex].categoryIdentifier === classes[j].identifier) {
        load.push(await loadPiximiImage(images[imageIndex]));
      }
    }
    trainAndValidationImages.push(load);

    load = [];
    for (let i = 0; i < testIndices.length; ++i) {
      let imageIndex = testIndices[i];
      if (images[imageIndex].categoryIdentifier === classes[j].identifier) {
        load.push(await loadPiximiImage(images[imageIndex]));
      }
    }
    testImages.push(load);
  }

  return {
    trainAndValidationImages,
    testImages,
  };
}

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

/**
 * Output loss and accuracy results at the end of training
 * Also evaluate the test dataset
 */
function showMetrics(
  alpha: number,
  time: number,
  logs: tf.Logs[],
  testAccuracy?: number
) {
  const lastEpoch = logs[logs.length - 1];

  const header = "α=" + alpha + ", t=" + (time / 1000).toFixed(1) + "s";

  const table = new Table({
    head: [header, "Accuracy", "Loss"],
    colWidths: [18, 10, 10],
  });

  table.push(
    ["Train", lastEpoch.acc.toFixed(3), lastEpoch.loss.toFixed(5)],
    ["Validation", lastEpoch.val_acc.toFixed(3), lastEpoch.val_loss.toFixed(5)]
  );
  console.log("\n" + table.toString());
}

const useStyles = makeStyles(styles);

type LossHistory = { x: number; y: number }[];

type FitClassifierDialogProps = {
  categories: types.Category[];
  setImagesPartition: (partitions: number[]) => void;
  closeDialog: () => void;
  images: types.Image[];
  openedDialog: boolean;
  openedDrawer: boolean;
  datasetInitialized: boolean;
  setDatasetInitialized: (datasetInitialized: boolean) => void;
};

export const FitClassifierDialog = (props: FitClassifierDialogProps) => {
  const {
    categories,
    closeDialog,
    images,
    openedDialog,
    openedDrawer,
    setImagesPartition,
    datasetInitialized,
    setDatasetInitialized,
  } = props;

  const styles = useStyles({});

  // if (images.length != 0) {
  //   const [src, setSrc] = useState(images[0].data);
  // }

  const [example, setExample] = useState<ImageJS.Image>(new ImageJS.Image());

  // const openImage = async () => {
  //   console.log(src);
  //   const image = await ImageJS.Image.load(src);
  //   setExample(image);
  // };

  // useEffect(() => {
  //   // console.log('foo');
  //   // openImage();
  //   // console.log(example.getHistograms());
  // });

  // assign each image to train- test- or validation- set
  const initializeDatasets = () => {
    if (datasetInitialized) {
      return;
    }
    var partitions: number[] = [];
    images.forEach((image: types.Image) => {
      const setItentifier = assignToSet();
      partitions.push(setItentifier);
    });
    setImagesPartition(partitions);
    setDatasetInitialized(true);
  };

  // Preprocessing clicks
  const [paddingOption1, setPaddingOption1] = React.useState<boolean>(false);
  const onPaddingOption1Click = () => {
    setPaddingOption1(!paddingOption1);
  };

  const [paddingOption2, setPaddingOption2] = React.useState<boolean>(false);
  const onpaddingOption2Click = () => {
    setPaddingOption2(!paddingOption2);
  };

  const [dataAugmentation, setDataAugmentation] = React.useState<boolean>(
    false
  );
  const onDataAugmentationClick = () => {
    setDataAugmentation(!dataAugmentation);
  };

  const [lowerPercentile, setLowerPercentile] = React.useState<number>(0);
  const onLowerPercentileChange = (event: React.FormEvent<EventTarget>) => {
    const target = event.target as HTMLInputElement;
    var value = Number(target.value);
    setLowerPercentile(value);
  };

  const [upperPercentile, setUpperPercentile] = React.useState<number>(1);
  const onUpperPercentileChange = (event: React.FormEvent<EventTarget>) => {
    const target = event.target as HTMLInputElement;
    var value = Number(target.value);
    setUpperPercentile(value);
  };

  const [
    collapsedPreprocessingList,
    setCollapsedPreprocessingList,
  ] = useState<boolean>(false);
  const onPreprocessingListClick = () => {
    // shows or hides preprocessing list in interface
    setCollapsedPreprocessingList(!collapsedPreprocessingList);
  };

  const onPreprocessingClick = async (
    lowerPercentile: number,
    upperPercentile: number,
    labeledData: types.Image[]
  ) => {
    //does actual preprocessing upon clicking button
    // Skeleton
    const rescaledSet = await rescaleData(
      lowerPercentile,
      upperPercentile,
      labeledData
    );
    const resizedSet = await resizeData(
      paddingOption1,
      paddingOption2,
      labeledData
    );
    const augmentedSet = await augmentData(dataAugmentation, labeledData);
  };

  const [datasetSplits, setDatasetSplits] = React.useState([60, 80]);

  const handleChange = (event: any, newValue: any) => {
    setDatasetSplits(newValue);
    setTestsetRatio(datasetSplits[1] - datasetSplits[0]);
  };
  function valuetext(value: any) {
    return `${value}%`;
  }

  const { collapsedList, collapseList } = useCollapseList();
  const [
    collapsedClasssifierSettingsList,
    setCollapsedClasssifierSettingsList,
  ] = useState<boolean>(false);

  const onClasssifierSettingsListClick = () => {
    setCollapsedClasssifierSettingsList(!collapsedClasssifierSettingsList);
  };

  const [
    collapsedDatasetSettingsList,
    setCollapsedDatasetSettingsList,
  ] = useState<boolean>(false);

  const onDatasetSettingsListClick = () => {
    setCollapsedDatasetSettingsList(!collapsedDatasetSettingsList);
  };

  const [stopTraining, setStopTraining] = useState<boolean>(false);
  const [batchSize, setBatchSize] = useState<number>(32);

  const [epochs, setEpochs] = useState<number>(10);

  const [optimizationAlgorithm, setOptimizationAlgorithm] = useState<string>(
    "adam"
  );
  const [learningRate, setLearningRate] = useState<number>(0.01);
  const [lossFunction, setLossFunction] = useState<string>("meanSquaredError");
  const [trainStatus, setTrainStatus] = useState<string>("meanSquaredError");
  const [inputShape, setInputShape] = useState<string>("224, 224, 3");

  const [trainingLossHistory, setTrainingLossHistory] = useState<LossHistory>(
    []
  );
  const updateLossHistory = (x: number, y: number) => {
    var history = trainingLossHistory;
    history.push({ x, y });
    setTrainingLossHistory(history);
  };

  const [
    trainingAccuracyHistory,
    setTrainingAccuracyHistory,
  ] = useState<LossHistory>([]);
  const updateAccuracHistory = (x: number, y: number) => {
    var history = trainingAccuracyHistory;
    history.push({ x, y });
    setTrainingAccuracyHistory(history);
  };

  const [
    trainingValidationAccuracyHistory,
    setTrainingValidationAccuracyHistory,
  ] = useState<LossHistory>([]);
  const updateValidationAccuracHistory = (x: number, y: number) => {
    var history = trainingValidationAccuracyHistory;
    history.push({ x, y });
    setTrainingValidationAccuracyHistory(history);
  };

  const [
    trainingValidationLossHistory,
    setTrainingValidationLossHistory,
  ] = useState<LossHistory>([]);

  const updateValidationLossHistory = (x: number, y: number) => {
    var history = trainingValidationLossHistory;
    history.push({ x, y });
    setTrainingValidationLossHistory(history);
  };

  const onBatchSizeChange = (event: React.FormEvent<EventTarget>) => {
    const target = event.target as HTMLInputElement;
    var value = Number(target.value);

    setBatchSize(value);
  };

  const onEpochsChange = (event: React.FormEvent<EventTarget>) => {
    const target = event.target as HTMLInputElement;
    var value = Number(target.value);

    setEpochs(value);
  };

  const onStopTrainingChange = () => {
    setStopTraining(true);
  };

  const resetStopTraining = async () => {
    setStopTraining(false);
  };

  const onInputShapeChange = (event: React.FormEvent<EventTarget>) => {
    const target = event.target as HTMLInputElement;

    setInputShape(target.value);
  };

  const onLearningRateChange = (event: React.FormEvent<EventTarget>) => {
    const target = event.target as HTMLInputElement;
    var value = Number(target.value);

    setLearningRate(value);
  };

  const onLossFunctionChange = (event: React.FormEvent<EventTarget>) => {
    const target = event.target as HTMLInputElement;

    setLossFunction(target.value);
  };

  const onOptimizationAlgorithmChange = (
    event: React.FormEvent<EventTarget>
  ) => {
    const target = event.target as HTMLInputElement;

    setOptimizationAlgorithm(target.value);
  };

  const className = classNames(styles.content, styles.contentLeft, {
    [styles.contentShift]: openedDrawer,
    [styles.contentShiftLeft]: openedDrawer,
  });

  const classes = {
    paper: styles.paper,
  };

  const lossLabelElement = document.getElementById("loss-label");
  const accuracyLabelElement = document.getElementById("accuracy-label");
  const lossValues = [[], []];
  function plotLoss(batch: any, loss: any, set: any) {
    const series = set === "train" ? 0 : 1;
    // @ts-ignore
    lossValues[series].push({ x: batch, y: loss });
    const lossContainer = document.getElementById("loss-canvas");
    tfvis.render.linechart(
      lossContainer,
      { values: lossValues, series: ["train", "validation"] },
      {
        xLabel: "Batch #",
        yLabel: "Loss",
        width: 400,
        height: 300,
      }
    );
    lossLabelElement!.innerText = `last loss: ${loss.toFixed(3)}`;
  }

  async function testMobilenet(
    dataset_url: string,
    version: number,
    loadFunction: Function,
    maxImages: number = 200,
    earlyStop: boolean = false
  ) {
    // classes, samplesPerClass, url
    const metadata = await (await fetch(dataset_url + "metadata.json")).json();
    // 1. Setup dataset parameters
    //const classLabels = metadata.classes as string[];
    const classLabels: string[] = [];
    for (let i = 0; i < categories.length; i++) {
      if (categories[i].identifier !== "00000000-0000-0000-0000-000000000000") {
        classLabels.push(categories[i].identifier);
      }
    }
    console.log(classLabels);

    let NUM_IMAGE_PER_CLASS = Math.ceil(maxImages / classLabels.length);

    if (NUM_IMAGE_PER_CLASS > Math.min(...metadata.samplesPerClass)) {
      NUM_IMAGE_PER_CLASS = Math.min(...metadata.samplesPerClass);
    }
    const TRAIN_VALIDATION_SIZE_PER_CLASS = NUM_IMAGE_PER_CLASS;

    const table = new Table();
    table.push({
      "train/validation size":
        TRAIN_VALIDATION_SIZE_PER_CLASS * classLabels.length,
    });
    console.log("\n" + table.toString());

    // 2. Create our datasets once
    // const datasets = await createDatasets(
    //   dataset_url,
    //   classLabels,
    //   TRAIN_VALIDATION_SIZE_PER_CLASS,
    //   0,
    //   loadFunction
    // );
    const classes = categories.filter((category: types.Category) => {
      return category.identifier !== "00000000-0000-0000-0000-000000000000";
    });
    const datasets = await createDatasetsFromPiximiImages(images, classes);
    const trainAndValidationImages = datasets.trainAndValidationImages;
    const testImages = datasets.testImages;

    // NOTE: If testing time, test first model twice because it takes longer
    // to train the very first time tf.js is training
    const MOBILENET_VERSION = version;
    let VALID_ALPHAS = [0.35];
    // const VALID_ALPHAS = [0.25, 0.5, 0.75, 1];
    // const VALID_ALPHAS = [0.4];
    let EPOCHS = 50;
    let LEARNING_RATE = 0.001;
    if (version === 1) {
      LEARNING_RATE = 0.0001;
      VALID_ALPHAS = [0.25];
      EPOCHS = 20;
    }

    const earlyStopEpochs = earlyStop ? 5 : EPOCHS;
  }

  async function testModel(
    model: any,
    alpha: number,
    classes: string[],
    trainAndValidationImages: HTMLImageElement[][],
    testImages: HTMLImageElement[][],
    testSizePerClass: number,
    epochs: number,
    learningRate: number,
    showEpochResults: boolean = false,
    earlyStopEpoch: number = epochs
  ) {
    model.setLabels(classes);
    model.setSeed(SEED_WORD); // set a seed to shuffle predictably

    const logs: tf.Logs[] = [];
    let time: number = 0;
    const epochLogs: any = [];

    await tf.nextFrame().then(async () => {
      let index = 0;
      for (const imgSet of trainAndValidationImages) {
        for (const img of imgSet) {
          await model.addExample(index, img);
        }
        index++;
      }
      const start = window.performance.now();
      await model.train(
        {
          denseUnits: 100,
          epochs,
          learningRate,
          batchSize: 16,
        },

        {
          onEpochEnd: function (epoch: any, log: any) {
            const accSurface = {
              name: "Accuracy History",
              tab: "Training",
            };
            const lossSurface = {
              name: "Loss History",
              tab: "Training",
            };
            const options = {
              xLabel: "Epoch",
              yLabel: "Value",
              yAxisDomain: [0, 1],
              seriesColors: ["teal", "tomato"],
            }; // Prep the data

            epochLogs.push(log);
            const acc = epochLogs.map((log: any, i: any) => ({
              x: i,
              y: log.acc,
            }));
            const valAcc = epochLogs.map((log: any, i: any) => ({
              x: i,
              y: log.val_acc,
            }));
            const loss = epochLogs.map((log: any, i: any) => ({
              x: i,
              y: log.loss,
            }));
            const valLoss = epochLogs.map((log: any, i: any) => ({
              x: i,
              y: log.val_loss,
            }));
            const accData = {
              values: [acc, valAcc],
              // Custom names for the series
              series: ["Accuracy", "Validation Accuracy"], // render the chart
            };
            const lossData = {
              values: [loss, valLoss],
              // Custom names for the series
              series: ["Loss", "Validation Loss"], // render the chart
            };
            // @ts-ignore
            tfvis.render.linechart(accSurface, accData, options);
            // @ts-ignore
            tfvis.render.linechart(lossSurface, lossData, options);
          },
        }
      );
      const end = window.performance.now();
      time = end - start;
    });

    //showMetrics(alpha, time, logs);
    return logs[logs.length - 1];
  }

  const onFit = async () => {
    vis.open();
    // testMobilenet(BEAN_DATASET_URL, 2, loadPngImage);
    testMobilenet(FLOWER_DATASET_URL, 1, loadPngImage);
  };

  enum LossFunction {
    "absoluteDifference",
    "cosineDistance",
    "hingeLoss",
    "huberLoss",
    "logLoss",
    "meanSquaredError",
    "sigmoidCrossEntropy",
    "categoricalCrossentropy",
  }

  // specifies interface
  return (
    // @ts-ignore
    <Dialog
      className={className}
      classes={classes}
      disableBackdropClick
      disableEscapeKeyDown
      fullScreen
      onClose={closeDialog}
      open={openedDialog}
      TransitionComponent={DialogTransition}
      style={{ zIndex: 900 }}
    >
      <DialogAppBar
        onStopTrainingChange={onStopTrainingChange}
        closeDialog={closeDialog}
        fit={onFit}
        openedDrawer={openedDrawer}
      />

      <DialogContent>
        <List dense>
          <ListItem
            button
            onClick={onPreprocessingListClick}
            style={{ padding: "12px 0px" }}
          >
            <ListItemIcon>
              {collapsedPreprocessingList ? (
                <ExpandLessIcon />
              ) : (
                <ExpandMoreIcon />
              )}
            </ListItemIcon>

            <ListItemText primary="Preprocessing" style={{ fontSize: "1em" }} />
          </ListItem>
          <Collapse
            in={collapsedPreprocessingList}
            timeout="auto"
            unmountOnExit
          >
            <Tooltip title="Apply Preprocessing Settings" placement="bottom">
              <div>
                <Button variant="contained" color="primary" onClick={() => {}}>
                  Apply preprocessing
                </Button>
              </div>
            </Tooltip>
            <Typography id="rescaling" gutterBottom>
              Pixel Intensity Rescaling
            </Typography>
            <RescalingForm
              onLowerPercentileChange={onLowerPercentileChange}
              onUpperPercentileChange={onUpperPercentileChange}
              lowerPercentile={lowerPercentile}
              upperPercentile={upperPercentile}
              closeDialog={closeDialog}
              openedDialog={openedDialog}
            />

            <Typography id="augmentation" gutterBottom>
              Data Augmentation
            </Typography>

            <FormGroup row>
              <FormControlLabel
                control={
                  // @ts-ignore
                  <Checkbox value="randomDataAugmentation" />
                }
                label="Random Data Augmentation"
              ></FormControlLabel>
            </FormGroup>

            <Typography id="resizing" gutterBottom>
              Resizing
            </Typography>

            <FormGroup row>
              <FormControlLabel
                // @ts-ignore
                control={<Checkbox value="paddingOption1" />}
                label="Padding Option 1"
              ></FormControlLabel>
            </FormGroup>

            <FormGroup row>
              <FormControlLabel
                // @ts-ignore
                control={<Checkbox value="paddingOption2" />}
                label="Padding Option 2"
              ></FormControlLabel>
            </FormGroup>
          </Collapse>
          <ListItem
            button
            onClick={onClasssifierSettingsListClick}
            style={{ padding: "12px 0px" }}
          >
            <ListItemIcon>
              {collapsedClasssifierSettingsList ? (
                <ExpandLessIcon />
              ) : (
                <ExpandMoreIcon />
              )}
            </ListItemIcon>

            <ListItemText
              primary="Classifier Settings"
              style={{ fontSize: "20px" }}
            />
          </ListItem>

          <Collapse
            in={collapsedClasssifierSettingsList}
            timeout="auto"
            unmountOnExit
          >
            <Form
              batchSize={batchSize}
              closeDialog={closeDialog}
              epochs={epochs}
              inputShape={inputShape}
              learningRate={learningRate}
              lossFunction={lossFunction}
              onBatchSizeChange={onBatchSizeChange}
              onEpochsChange={onEpochsChange}
              onInputShapeChange={onInputShapeChange}
              onLearningRateChange={onLearningRateChange}
              onLossFunctionChange={onLossFunctionChange}
              onOptimizationAlgorithmChange={onOptimizationAlgorithmChange}
              // onDataAugmentationChange={onDataAugmentationChange}
              openedDialog={openedDialog}
              optimizationAlgorithm={optimizationAlgorithm}
            />
          </Collapse>
          <ListItem
            button
            onClick={onDatasetSettingsListClick}
            style={{ padding: "12px 0px" }}
          >
            <ListItemIcon>
              {collapsedDatasetSettingsList ? (
                <ExpandLessIcon />
              ) : (
                <ExpandMoreIcon />
              )}
            </ListItemIcon>

            <ListItemText
              primary="Dataset Settings"
              style={{ fontSize: "1em" }}
            />
          </ListItem>

          <Collapse
            in={collapsedDatasetSettingsList}
            timeout="auto"
            unmountOnExit
          >
            <Tooltip title="Initialize dataset" placement="bottom">
              <Button
                variant="contained"
                color="primary"
                onClick={initializeDatasets}
              >
                Initialize Dataset
              </Button>
            </Tooltip>
            <div style={{ padding: "12px 0px", width: "300" }}>
              <Typography id="range-slider" gutterBottom>
                Dataset Splits
              </Typography>

              <Slider
                value={datasetSplits}
                onChange={handleChange}
                valueLabelDisplay="auto"
                aria-labelledby="range-slider"
                getAriaValueText={valuetext}
              />
            </div>
          </Collapse>
        </List>
      </DialogContent>
    </Dialog>
  );
};
