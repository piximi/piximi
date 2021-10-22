import React from "react";
import { MnistData } from "../../examples/mnist/data";
import * as tensorflow from "@tensorflow/tfjs";
import { Tensor2D } from "@tensorflow/tfjs";
import * as ImageJS from "image-js";
import { Image } from "../../types/Image";
import * as uuid from "uuid";
import { Project } from "../../types/Project";
import { Category } from "../../types/Category";
import { classifierSlice, projectSlice } from "../../store/slices";
import { useDispatch } from "react-redux";
import { CompileOptions } from "../../types/CompileOptions";
import { LossFunction } from "../../types/LossFunction";
import { Metric } from "../../types/Metric";
import { OptimizationAlgorithm } from "../../types/OptimizationAlgorithm";
import { FitOptions } from "../../types/FitOptions";
import { MenuItem } from "@mui/material";

type OpenExampleProjectMenuItemProps = {
  popupState: any;
};

const getRandomColor = () => {
  var letters = "0123456789ABCDEF";
  var color = "#";
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

export const OpenExampleProjectMenuItem = ({
  popupState,
}: OpenExampleProjectMenuItemProps) => {
  const dispatch = useDispatch();

  const onClickExampleProject = async () => {
    popupState.close();

    // Load project with data
    const data = new MnistData();
    await data.load();

    const numExamples = 1000; //Eventually you might want to change this back to ~7000 (better training)

    //those are the examples we'll show to the user (as to not load all data)
    const examples = data.nextTrainBatch(numExamples);

    if (!examples) return;

    const classes = examples.labels.argMax(-1).dataSync(); // gives array of labels for each example in batch

    const images: Array<Image> = [];
    const categories: Array<Category> = [
      {
        color: "#AAAAAA",
        id: "00000000-0000-0000-0000-000000000000",
        name: "Unknown",
        visible: true,
      },
    ];

    // Create a canvas element to render each example
    for (let i = 0; i < numExamples; i++) {
      if (i % 500 === 0) {
        console.info(`Processing image #${i} out of ${numExamples} images`);
      }
      const imageTensor = tensorflow.tidy(() => {
        return examples.xs
          .slice([i, 0], [1, examples.xs.shape[1]])
          .reshape([28, 28, 1]);
      }) as Tensor2D;

      const category = categories.find((el: Category) => {
        return el.name === classes[i].toString();
      });
      let id;

      if (!category) {
        id = uuid.v4();
        categories.push({
          color: getRandomColor(),
          id: id,
          name: classes[i].toString(),
          visible: true,
        });
      }

      const canvas = document.createElement("canvas");
      canvas.width = 28;
      canvas.height = 28;
      const pixels = await tensorflow.browser.toPixels(imageTensor, canvas);

      //Make ImageJS object
      const img = new ImageJS.Image(28, 28, pixels, {
        components: 3,
        alpha: 1,
      });

      //Make Image object from URI
      const image: Image = {
        categoryId: category ? category.id : id,
        id: uuid.v4(),
        instances: [],
        name: "mnist",
        shape: { r: 28, c: 28, channels: 1 },
        src: img.toDataURL("image/png", {
          useCanvas: true,
        }),
      };

      images.push(image);

      imageTensor.dispose();
    }

    const mnistProject: Project = {
      categories: categories,
      images: images,
      name: "mnist",
    };

    dispatch(projectSlice.actions.createProject({ project: mnistProject }));

    const mnistFitOptions: FitOptions = {
      batchSize: 512,
      epochs: 10,
      initialEpoch: 0,
      test_data_size: 1000, //for better accuracy, experiment with 10000
      train_data_size: 6500, //for better accuracy, experiment with 55000
      shuffle: true,
    };

    const mnistCompileOptions: CompileOptions = {
      learningRate: 0.001,
      lossFunction: LossFunction.CategoricalCrossEntropy,
      metrics: [Metric.CategoricalAccuracy],
      optimizationAlgorithm: OptimizationAlgorithm.Adam,
    };

    const training_percentage = 0.85;

    const mnistClassifier = {
      fitOptions: mnistFitOptions,
      inputShape: { r: 28, c: 28, channels: 1 },
      learningRate: mnistCompileOptions.learningRate,
      lossFunction: mnistCompileOptions.lossFunction,
      metrics: mnistCompileOptions.metrics,
      modelMultiplier: "0.0",
      modelName: "SimpleCNN",
      modelVersion: "1",
      optimizationAlgorithm: mnistCompileOptions.optimizationAlgorithm,
      testPercentage: 0.2,
      trainingPercentage: training_percentage, //determines train-val split
    };

    dispatch(classifierSlice.actions.openMnistClassifier({ mnistClassifier }));
  };

  return (
    <MenuItem onClick={onClickExampleProject}>
      Open example project (mnist)
    </MenuItem>
  );
};
