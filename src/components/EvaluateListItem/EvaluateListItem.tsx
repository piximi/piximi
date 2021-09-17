import React from "react";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import BarChartIcon from "@material-ui/icons/BarChart";
import * as tf from "@tensorflow/tfjs";
import { useImage } from "../../hooks/useImage/useImage";

//TMP code for experimenting
const mobilenetDemo = async (image: HTMLImageElement) => {
  const MOBILENET_MODEL_PATH =
    // tslint:disable-next-line:max-line-length
    "https://tfhub.dev/google/tfjs-model/imagenet/mobilenet_v2_100_224/classification/3/default/1";

  const IMAGE_SIZE = 224;
  const TOPK_PREDICTIONS = 10;

  console.info("Loading model...");

  let mobilenet;

  mobilenet = await tf.loadGraphModel(MOBILENET_MODEL_PATH, {
    fromTFHub: true,
  });

  // Warmup the model. This isn't necessary, but makes the first prediction
  // faster. Call `dispose` to release the WebGL memory allocated for the return
  // value of `predict`.
  (mobilenet.predict(
    tf.zeros([1, IMAGE_SIZE, IMAGE_SIZE, 3])
  ) as tf.Tensor).dispose();

  console.info("successful load");

  //TODO: make prediction on image
};

export const EvaluateListItem = () => {
  const image = useImage();

  if (!image) return <React.Fragment />;

  const onEvaluateClick = () => {
    console.info("Clicked on evaluate! ");

    mobilenetDemo(image);
  };

  return (
    <React.Fragment>
      <ListItem button onClick={onEvaluateClick}>
        <ListItemIcon>
          <BarChartIcon />
        </ListItemIcon>

        <ListItemText primary="Evaluate" />
      </ListItem>
    </React.Fragment>
  );
};
