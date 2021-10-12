import React from "react";
import MenuItem from "@material-ui/core/MenuItem";
import { MnistData } from "../../examples/mnist/data";
import * as tensorflow from "@tensorflow/tfjs";
import { Tensor2D } from "@tensorflow/tfjs";
import * as ImageJS from "image-js";
import { Image } from "../../types/Image";
import * as uuid from "uuid";
import { Project } from "../../types/Project";
import { Category } from "../../types/Category";
import { projectSlice } from "../../store/slices";
import { useDispatch, useSelector } from "react-redux";
import { CompileOptions } from "../../types/CompileOptions";
import { LossFunction } from "../../types/LossFunction";
import { Metric } from "../../types/Metric";
import { OptimizationAlgorithm } from "../../types/OptimizationAlgorithm";
import { getModel } from "../FitClassifierDialog/FitClassifierDialog/networks";
import { compile } from "../../store/coroutines/classifier/compile";
import { categorizedImagesSelector } from "../../store/selectors";
import { FitOptions } from "../../types/FitOptions";
import * as tfvis from "@tensorflow/tfjs-vis";

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

  const categorizedImages = useSelector(categorizedImagesSelector);

  const onClickExampleProject = async () => {
    popupState.close();

    // Load project with data
    const data = new MnistData();
    await data.load();
    const examples = data.nextTestBatch(100);

    if (!examples) return;

    const numExamples = examples.xs.shape[0];

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
      const imageTensor = tensorflow.tidy(() => {
        return examples.xs
          .slice([i, 0], [1, examples.xs.shape[1]])
          .reshape([28, 28, 1]);
      }) as Tensor2D;

      // load tensor data into image

      const canvas = document.createElement("canvas");
      canvas.width = 28;
      canvas.height = 28;
      const pixels = await tensorflow.browser.toPixels(imageTensor, canvas);

      //Make ImageJS object
      const img = new ImageJS.Image(28, 28, pixels, {
        components: 3,
        alpha: 1,
      });

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

      //Make Image object from URI
      const image: Image = {
        categoryId: category ? category.id : id,
        id: uuid.v4(),
        instances: [],
        name: "mnist",
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

    //TODO  Update classifier settings
    //Call UpdateImageShape to be 32, 32
    //Call Update compile options, where you set the loss function, epoch, optimization algoirhtm, etc to what is suggested in the tutorial
    //Set the layers "model" of classifier to correspond to the definition described in the tutorial

    const mnistCompileOptions: CompileOptions = {
      learningRate: 0.001,
      lossFunction: LossFunction.CategoricalCrossEntropy,
      metrics: [Metric.BinaryAccuracy],
      optimizationAlgorithm: OptimizationAlgorithm.Adam,
    };

    const mnistModel = getModel();

    const compiledMnistModel = compile(mnistModel, mnistCompileOptions);

    const mnistFitOptions: FitOptions = {
      batchSize: 512,
      epochs: 10,
      initialEpoch: 0,
      test_data_size: 1000,
      train_data_size: 5500,
      shuffle: true,
    };

    //TODO add callback options to Types and to Classifier project
    const metrics = ["loss", "val_loss", "acc", "val_acc"];
    const container = {
      name: "Model Training",
      tab: "Model",
      styles: { height: "1000px" },
    };
    const fitCallbacks = tfvis.show.fitCallbacks(container, metrics);
    //TODO fix tfvis (can't see it)

    const [trainXs, trainYs] = tensorflow.tidy(() => {
      const d = data.nextTrainBatch(mnistFitOptions.train_data_size!);

      if (!d) return;

      return [
        d.xs.reshape([mnistFitOptions.train_data_size!, 28, 28, 1]),
        d.labels,
      ];
    }) as Array<Tensor2D>;

    const [testXs, testYs] = tensorflow.tidy(() => {
      const d = data.nextTestBatch(mnistFitOptions.test_data_size!);
      if (!d) return;
      return [
        d.xs.reshape([mnistFitOptions.test_data_size!, 28, 28, 1]),
        d.labels,
      ];
    }) as Array<Tensor2D>;

    console.info("Fitting...");

    const history = await mnistModel.fit(trainXs, trainYs, {
      batchSize: mnistFitOptions.batchSize!,
      validationData: [testXs, testYs],
      epochs: mnistFitOptions.epochs!,
      shuffle: true,
      callbacks: fitCallbacks,
    });

    // const data = yield preprocess(images, categories);
    //
    //
    // const { fitted, status } = yield fit(compiled, data, options, onEpochEnd);
    //
    // const payload = { fitted: fitted, status: status };
    //
    // yield put(classifierSlice.actions.updateFitted(payload));
  };

  return (
    <MenuItem onClick={onClickExampleProject}>
      Open example project (mnist)
    </MenuItem>
  );
};
