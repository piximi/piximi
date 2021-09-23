import { Dialog, DialogContent } from "@material-ui/core";
import * as React from "react";
import * as tf from "@tensorflow/tfjs";
import { PredictSegmenterDialogAppBar } from "../PredictSegmenterDialogAppBar";
import { DialogTransition } from "../DialogTransition";
import { useStyles } from "./PredictSegmenterDialog.css";
import Container from "@material-ui/core/Container";
import { useSelector } from "react-redux";
import { imagesSelector } from "../../../store/selectors";
import * as ImageJS from "image-js";

const overlayLabels = (imageData: Uint8Array, labelData: Uint8Array) => {
  const labelOpacity = 0.3;
  const imgOpacity = 1 - labelOpacity;

  const colorData = [];
  const [r, g, b] = [255, 0, 0]; // color of label
  for (let i = 0; i < labelData.length; i += 4) {
    if (labelData[i] === 0) {
      colorData.push(imageData[i] * imgOpacity);
      colorData.push(imageData[i + 1] * imgOpacity);
      colorData.push(imageData[i + 2] * imgOpacity);
      colorData.push(255);
    } else {
      colorData.push(imageData[i] * imgOpacity + r * labelOpacity);
      colorData.push(imageData[i + 1] * imgOpacity + g * labelOpacity);
      colorData.push(imageData[i + 2] * imgOpacity + b * labelOpacity);
      colorData.push(255);
    }
  }

  const [width, height] = [216, 216]; //FIXME this should not be hard coded

  //look at image
  const overlay = new ImageJS.Image(width, height, colorData, {
    alpha: 1,
    components: 3,
  });

  return overlay;
};

const forwardPass = async (image: ImageJS.Image, imgSize: number, net: any) => {
  console.info("Predicting...");

  const out = tf.tidy(() => {
    // tf.browser.fromPixels() returns a Tensor from an image element.
    const img = tf.cast(tf.browser.fromPixels(image.getCanvas()), "float32");

    const offset = tf.scalar(127.5);
    // Normalize the image from [0, 255] to [-1, 1].
    const normalized = img.sub(offset).div(offset);

    // Reshape to a single-element batch so we can pass it to predict.
    const batched = normalized.reshape([1, imgSize, imgSize, 3]);

    //make prediction
    return net.predict(batched);
  });

  const probs = tf.squeeze(tf.argMax(out, 3)) as tf.Tensor2D;
  return await tf.browser.toPixels(probs);
};

type EvaluateClassifierDialogProps = {
  closeDialog: () => void;
  openedDialog: boolean;
};

export const PredictSegmenterDialog = (
  props: EvaluateClassifierDialogProps
) => {
  const classes = useStyles({});

  const { closeDialog, openedDialog } = props;

  const images = useSelector(imagesSelector);

  const [imageData, setImageData] = React.useState<string>(images[0].src);

  const predictTensorflowModel = async () => {
    const image = images[0]; //FIXME: in the future, ask the user to select an image

    const MOBILENET_MODEL_PATH =
      // tslint:disable-next-line:max-line-length
      "https://storage.piximi.app/examples/unet/model.json";

    const IMAGE_SIZE = 224;
    const BORDER = 4; //account for border effects

    const model = await tf.loadLayersModel(MOBILENET_MODEL_PATH);
    // Warmup the model. This isn't necessary, but makes the first prediction
    // faster. Call `dispose` to release the WebGL memory allocated for the return
    // value of `predict`.
    (model.predict(
      tf.zeros([1, IMAGE_SIZE, IMAGE_SIZE, 3])
    ) as tf.Tensor).dispose();

    console.info("successful load");

    if (!image) return;

    //Resize image to [IMAGE_SIZE, IMAGE_SIZE]
    const img = await ImageJS.Image.load(image.src);
    const resizedImg = img.resize({ width: IMAGE_SIZE, height: IMAGE_SIZE });

    const labelData = await forwardPass(resizedImg, IMAGE_SIZE, model);

    const cropped = resizedImg.crop({
      x: BORDER,
      y: BORDER,
      height: IMAGE_SIZE - 2 * BORDER,
      width: IMAGE_SIZE - 2 * BORDER,
    });

    const overlay = overlayLabels(
      Uint8Array.from(cropped.data) as Uint8Array,
      Uint8Array.from(labelData)
    );

    setImageData(overlay.toDataURL());
  };

  const onPredict = async () => {
    await predictTensorflowModel().then(() => {});
  };

  return (
    // @ts-ignore
    <Dialog
      disableBackdropClick
      disableEscapeKeyDown
      fullScreen
      onClose={closeDialog}
      open={openedDialog}
      TransitionComponent={DialogTransition}
      style={{ zIndex: 1203 }}
    >
      <PredictSegmenterDialogAppBar
        closeDialog={closeDialog}
        evaluate={onPredict}
      />
      <div>
        <Container className={classes.container} maxWidth={"sm"}>
          <img alt="" src={imageData} className={classes.imageTile} />
        </Container>
      </div>

      <DialogContent style={{ padding: "0px", margin: "12px" }}>
        <div
          id="tfjs-visor-container"
          style={{
            position: "absolute",
            height: "100%",
            width: "100%",
            padding: "12px",
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
