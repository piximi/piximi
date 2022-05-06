import Dialog from "@mui/material/Dialog";
import { batch, useDispatch } from "react-redux";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import malaria from "../../../../images/malaria.png";
import cellPainting from "../../../../images/cell-painting.png";
import * as malariaAnnotations from "../../../../images/malaria.json";
import * as cellPaintingAnnotations from "../../../../images/cell-painting.json";
import {
  convertToImage,
  generateDefaultChannels,
} from "../../../../image/imageHelper";
import { imageViewerSlice, setActiveImage } from "../../../../store/slices";
import { SerializedFileType } from "types/SerializedFileType";
import * as ImageJS from "image-js";
import { v4 as uuidv4 } from "uuid";

type ExampleImageDialogProps = {
  onClose: () => void;
  open: boolean;
};

export const ExampleImageDialog = ({
  onClose,
  open,
}: ExampleImageDialogProps) => {
  const dispatch = useDispatch();

  const exampleImages = [
    {
      exampleImageName: "malaria.png",
      exampleImageData: malaria,
      description:
        "Blood cells infected by malaria and stained with Giemsa reagent. Image from the Broad Bioimage Benchmark Collection, image set BBBC041v1.",
      exampleImageAnnotations:
        malariaAnnotations as unknown as SerializedFileType,
    },
    {
      exampleImageName: "cell-painting.png",
      exampleImageData: cellPainting,
      description:
        "U2OS cells treated with an RNAi reagent (https://iwww.broadinstitute.org/rnai/db/clone/details?cloneId=TRCN0000195467) and stained for a " +
        "cell-painting experiment (Merged; red: Actin, Golgi, and Plasma membrane stained via phalloidin and wheat germ agglutinin; " +
        "blue: DNA stained via Hoechst; green: mitochondria stained via MitoTracker).",
      exampleImageAnnotations:
        cellPaintingAnnotations as unknown as SerializedFileType,
    },
  ];

  const openExampleImage = async ({
    exampleImageName,
    exampleImageData,
    exampleImageAnnotations,
  }: {
    exampleImageName: string;
    exampleImageData: any;
    exampleImageAnnotations: any;
  }) => {
    onClose();

    const serializedExampleImageFile =
      exampleImageAnnotations[0] as SerializedFileType;

    const defaultColors = generateDefaultChannels(
      serializedExampleImageFile.imageChannels
    );

    const exampleImageSrc = exampleImageData as string;
    const exampleImage = await ImageJS.Image.load(exampleImageSrc, {
      ignorePalette: true,
    });
    const exampleImageTypeObject = convertToImage(
      [exampleImage],
      exampleImageName,
      defaultColors,
      serializedExampleImageFile.imagePlanes,
      serializedExampleImageFile.imageChannels
    );

    serializedExampleImageFile.imageId = uuidv4();
    serializedExampleImageFile.imageSrc = exampleImageSrc;
    serializedExampleImageFile.imageData = exampleImageTypeObject.originalSrc;

    batch(() => {
      dispatch(
        imageViewerSlice.actions.openAnnotations({
          file: serializedExampleImageFile,
        })
      );

      dispatch(
        setActiveImage({
          imageId: serializedExampleImageFile.imageId,
        })
      );
    });
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <List component="div" role="list">
        {exampleImages.map((exampleImage, index) => {
          return (
            <ListItem
              button
              divider
              key={index}
              role="listitem"
              onClick={() => openExampleImage(exampleImage)}
            >
              <ListItemText
                primary={exampleImage.exampleImageName}
                secondary={exampleImage.description}
              />
            </ListItem>
          );
        })}
      </List>
    </Dialog>
  );
};
