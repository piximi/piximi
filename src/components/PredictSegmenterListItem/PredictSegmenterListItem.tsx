import React from "react";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import BarChartIcon from "@material-ui/icons/BarChart";
import * as tf from "@tensorflow/tfjs";
import { useImage } from "../../hooks/useImage/useImage";
import * as ImageJS from "image-js";
import LabelImportantIcon from "@material-ui/icons/LabelImportant";

const postprocessOutput = async (
  out: tf.Tensor4D
): Promise<Uint8ClampedArray> => {
  const probs = tf.squeeze(tf.argMax(out, 3)) as tf.Tensor2D;
  const pixels = await tf.browser.toPixels(probs);

  out.dispose();
  probs.dispose();

  return pixels;
};

async function predict(
  imgElement: HTMLImageElement,
  imgSize: number,
  net: any
) {
  console.info("Predicting...");

  // The first start time includes the time it takes to extract the image
  // from the HTML and preprocess it, in additon to the predict() call.
  const startTime1 = performance.now();
  // The second start time excludes the extraction and preprocessing and
  // includes only the predict() call.
  let startTime2 = 0;
  const out = tf.tidy(() => {
    // tf.browser.fromPixels() returns a Tensor from an image element.
    const img = tf.cast(tf.browser.fromPixels(imgElement), "float32");

    const offset = tf.scalar(127.5);
    // Normalize the image from [0, 255] to [-1, 1].
    const normalized = img.sub(offset).div(offset);

    // Reshape to a single-element batch so we can pass it to predict.
    const resized = normalized.resizeBilinear([imgSize, imgSize]);
    const batched = resized.reshape([1, imgSize, imgSize, 3]);

    startTime2 = performance.now();

    //make prediction
    return net.predict(batched);
  });

  // Convert logits to probabilities and class names.
  const totalTime1 = performance.now() - startTime1;
  const totalTime2 = performance.now() - startTime2;
  console.info(
    `Done in ${Math.floor(totalTime1)} ms ` +
      `(not including preprocessing: ${Math.floor(totalTime2)} ms)`
  );
  return out;
}

const mobilenetDemo = async (image: HTMLImageElement) => {
  // const MOBILENET_MODEL_PATH =
  //   // tslint:disable-next-line:max-line-length
  //   "https://tfhub.dev/google/tfjs-model/imagenet/mobilenet_v2_100_224/classification/3/default/1";

  const MOBILENET_MODEL_PATH =
    // tslint:disable-next-line:max-line-length
    "https://storage.piximi.app/examples/unet/model.json";

  const IMAGE_SIZE = 224;
  const TOPK_PREDICTIONS = 10;

  console.info("Loading model...");

  let mobilenet;

  // mobilenet = await tf.loadGraphModel(MOBILENET_MODEL_PATH, {
  //   fromTFHub: true,
  // });
  mobilenet = await tf.loadLayersModel(MOBILENET_MODEL_PATH);

  // Warmup the model. This isn't necessary, but makes the first prediction
  // faster. Call `dispose` to release the WebGL memory allocated for the return
  // value of `predict`.
  (mobilenet.predict(
    tf.zeros([1, IMAGE_SIZE, IMAGE_SIZE, 3])
  ) as tf.Tensor).dispose();

  console.info("successful load");

  if (image.complete && image.height !== 0) {
    const out = await predict(image, IMAGE_SIZE, mobilenet);
    const labels = await postprocessOutput(out);
    const colorData = [];
    const [r, g, b] = [255, 0, 0];
    for (let i = 0; i < labels.length; i += 4) {
      if (labels[i] === 0) {
        colorData.push(0);
        colorData.push(0);
        colorData.push(0);
        colorData.push(255);
      } else {
        colorData.push(r);
        colorData.push(g);
        colorData.push(b);
        colorData.push(255);
      }
    }

    const [width, height] = [216, 216]; //FIXME this should not be hard coded

    //look at image
    const result = new ImageJS.Image(width, height, colorData, {
      alpha: 1,
      components: 3,
    });
    console.info(result.toDataURL());
  }
};

export const PredictSegmenterListItem = () => {
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
          <LabelImportantIcon />
        </ListItemIcon>

        <ListItemText primary="Predict" />
      </ListItem>
    </React.Fragment>
  );
};
