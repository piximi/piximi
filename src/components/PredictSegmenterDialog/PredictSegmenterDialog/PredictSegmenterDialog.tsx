import { Dialog, DialogContent } from "@material-ui/core";
import * as React from "react";
import * as tf from "@tensorflow/tfjs";
import { PredictSegmenterDialogAppBar } from "../PredictSegmenterDialogAppBar";
import { DialogTransition } from "../DialogTransition";
import { useStyles } from "./PredictSegmenterDialog.css";
import { Image } from "../../../types/Image";
import Container from "@material-ui/core/Container";
import GridList from "@material-ui/core/GridList";
import GridListTile from "@material-ui/core/GridListTile";
import { ImageGridAppBar } from "../../ImageGridAppBar";
import { useSelector } from "react-redux";
import { imagesSelector } from "../../../store/selectors";
import { tileSizeSelector } from "../../../store/selectors/tileSizeSelector";
import * as ImageJS from "image-js";

type EvaluateClassifierDialogProps = {
  closeDialog: () => void;
  openedDialog: boolean;
};

function roundToFour(num: number) {
  // @ts-ignore
  return +(Math.round(num + "e+4") + "e-4");
}

export const PredictSegmenterDialog = (
  props: EvaluateClassifierDialogProps
) => {
  const classes = useStyles({});

  const { closeDialog, openedDialog } = props;

  const images = useSelector(imagesSelector);

  const forwardPass = async (image: Image, imgSize: number, net: any) => {
    console.info("Predicting...");

    const data = await ImageJS.Image.load(image.src);

    const out = tf.tidy(() => {
      // tf.browser.fromPixels() returns a Tensor from an image element.
      const img = tf.cast(tf.browser.fromPixels(data.getCanvas()), "float32");

      const offset = tf.scalar(127.5);
      // Normalize the image from [0, 255] to [-1, 1].
      const normalized = img.sub(offset).div(offset);

      // Reshape to a single-element batch so we can pass it to predict.
      const resized = normalized.resizeBilinear([imgSize, imgSize]);
      const batched = resized.reshape([1, imgSize, imgSize, 3]);

      //make prediction
      return net.predict(batched);
    });

    const probs = tf.squeeze(tf.argMax(out, 3)) as tf.Tensor2D;
    return await tf.browser.toPixels(probs);
  };

  const predictTensorflowModel = async () => {
    const image = images[0]; //FIXME: in the future, ask the user to select an image

    const MOBILENET_MODEL_PATH =
      // tslint:disable-next-line:max-line-length
      "https://storage.piximi.app/examples/unet/model.json";

    const IMAGE_SIZE = 224;

    const model = await tf.loadLayersModel(MOBILENET_MODEL_PATH);
    // Warmup the model. This isn't necessary, but makes the first prediction
    // faster. Call `dispose` to release the WebGL memory allocated for the return
    // value of `predict`.
    (model.predict(
      tf.zeros([1, IMAGE_SIZE, IMAGE_SIZE, 3])
    ) as tf.Tensor).dispose();

    console.info("successful load");

    if (!image) return;

    const labels = await forwardPass(image, IMAGE_SIZE, model);

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
  };

  const onPredict = async () => {
    await predictTensorflowModel().then(() => {});
  };

  const getSize = (scaleFactor: number) => {
    const width = (230 * scaleFactor).toString() + "px";
    const height = (185 * scaleFactor).toString() + "px";
    return {
      width: width,
      height: height,
      background: "lightgray",
      margin: "2px",
    };
  };

  const scaleFactor = useSelector(tileSizeSelector);

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
        <Container className={classes.container} maxWidth={false}>
          <GridList
            className={classes.gridList}
            cols={Math.floor(4 / scaleFactor)}
            cellHeight="auto"
          >
            {images.map((image: Image) => (
              <GridListTile key={image.id} style={getSize(scaleFactor)}>
                <img alt="" src={image.src} className={classes.imageTile} />
              </GridListTile>
            ))}
          </GridList>

          <ImageGridAppBar />
        </Container>
        {/*<Grid container spacing={3}>*/}
        {/*  <Grid id="evaluationID">*/}
        {/*    <Paper*/}
        {/*      style={{*/}
        {/*        margin: "24px",*/}
        {/*        padding: "24px",*/}
        {/*        fontSize: "larger",*/}
        {/*      }}*/}
        {/*    >*/}
        {/*      accuracy: {accuracy}*/}
        {/*    </Paper>*/}
        {/*  </Grid>*/}
        {/*</Grid>*/}
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
