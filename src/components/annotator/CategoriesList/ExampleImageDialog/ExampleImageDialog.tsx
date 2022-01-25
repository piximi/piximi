import Dialog from "@mui/material/Dialog";
import React from "react";
import { ShapeType } from "../../../../types/ShapeType";
import { batch, useDispatch, useSelector } from "react-redux";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import malaria from "../../../../images/malaria.png";
import cellpainting from "../../../../images/cell-painting.png";
import { ChannelType } from "../../../../types/ChannelType";
import { ToolType } from "../../../../types/ToolType";
// import { ImageViewerImage } from "../../../../types/ImageViewerImage";
import { v4 as uuidv4 } from "uuid";
import * as malariaAnnotations from "../../../../images/malaria.json";
import * as cellpaintingAnnotations from "../../../../images/cellpainting.json";
import { AnnotationType } from "../../../../types/AnnotationType";
import { SerializedAnnotationType } from "../../../../types/SerializedAnnotationType";
import { Category, UNKNOWN_CATEGORY_ID } from "../../../../types/Category";
import { categoriesSelector } from "../../../../store/selectors";
import { importSerializedAnnotations } from "../../../../image/imageHelper";
import {
  imageViewerSlice,
  setActiveImage,
  setChannels,
  setImages,
  setOperation,
  setSelectedAnnotations,
} from "../../../../store/slices";
import { Image } from "../../../../types/Image";
import { Partition } from "../../../../types/Partition";
import { annotatorImagesSelector } from "../../../../store/selectors/annotatorImagesSelector";
import { DEFAULT_COLORS } from "../../../../types/Colors";

type ExampleImageDialogProps = {
  onClose: () => void;
  open: boolean;
};

export const ExampleImageDialog = ({
  onClose,
  open,
}: ExampleImageDialogProps) => {
  const dispatch = useDispatch();

  const images = useSelector(annotatorImagesSelector);

  const categories_in = useSelector(categoriesSelector);

  const examples = [
    {
      name: "malaria.png",
      description:
        "Blood cells infected by malaria and stained with Giemsa reagent. Image from the Broad Bioimage Benchmark Collection, image set BBBC041v1.",
      data: malaria,
      project: (malariaAnnotations as any).default,
      shape: {
        channels: 3,
        frames: 1,
        height: 1200,
        planes: 1,
        width: 1600,
      },
    },
    {
      name: "cell-painting.png",
      description:
        "U2OS cells treated with an RNAi reagent (https://iwww.broadinstitute.org/rnai/db/clone/details?cloneId=TRCN0000195467) and stained for a " +
        "cell-painting experiment (Merged; red: Actin, Golgi, and Plasma membrane stained via phalloidin and wheat germ agglutinin; " +
        "blue: DNA stained via Hoechst; green: mitochondria stained via MitoTracker).",
      data: cellpainting,
      project: (cellpaintingAnnotations as any).default,
      shape: {
        channels: 3,
        frames: 1,
        height: 512,
        planes: 1,
        width: 512,
      },
    },
  ];

  const onClick = ({
    data,
    description,
    name,
    shape,
    project,
  }: {
    data: any;
    description: string;
    name: string;
    project: any;
    shape: ShapeType;
  }) => {
    onClose();

    let channels: Array<ChannelType> = [];
    for (let i = 0; i < shape.channels; i++) {
      channels.push({
        color: DEFAULT_COLORS[i],
        visible: true,
        range: [0, 255],
      });
    }

    const newAnnotations: Array<AnnotationType> = [];

    let updatedCategories: Array<Category> = categories_in;

    project[0].annotations.forEach(
      (serializedAnnotation: SerializedAnnotationType) => {
        const { annotation_out, categories } = importSerializedAnnotations(
          serializedAnnotation,
          updatedCategories
        );

        updatedCategories = categories;

        newAnnotations.push(annotation_out);
      }
    );

    const example: Image = {
      categoryId: UNKNOWN_CATEGORY_ID,
      id: uuidv4(),
      annotations: newAnnotations,
      name: name,
      shape: shape,
      originalSrc: [], //TODO fix this
      partition: Partition.Inference,
      src: data as string,
    };

    batch(() => {
      dispatch(setImages({ images: [...images, example] }));

      dispatch(
        setActiveImage({
          image: example.id,
        })
      );

      dispatch(setChannels({ channels }));

      dispatch(setOperation({ operation: ToolType.RectangularAnnotation }));

      dispatch(
        setSelectedAnnotations({
          selectedAnnotations: [],
          selectedAnnotation: undefined,
        })
      );

      dispatch(
        imageViewerSlice.actions.setCategories({
          categories: updatedCategories,
        })
      );
    });
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <List component="div" role="list">
        {examples.map((example, index) => {
          return (
            <ListItem
              button
              divider
              key={index}
              role="listitem"
              onClick={() => onClick(example)}
            >
              <ListItemText
                primary={example.name}
                secondary={example.description}
              />
            </ListItem>
          );
        })}
      </List>
    </Dialog>
  );
};
