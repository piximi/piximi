import Dialog from "@mui/material/Dialog";
import React from "react";
import { ShapeType } from "../../../../annotator/types/ShapeType";
import {
  applicationSlice,
  setActiveImage,
  setChannels,
  setImages,
  setOperation,
  setSelectedAnnotations,
} from "../../../../annotator/store";
import { batch, useDispatch, useSelector } from "react-redux";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import malaria from "../../../../annotator/images/malaria.png";
import cellpainting from "../../../../annotator/images/cell-painting.png";
import { ChannelType } from "../../../../annotator/types/ChannelType";
import { ToolType } from "../../../../annotator/types/ToolType";
import { ImageType } from "../../../../annotator/types/ImageType";
import { v4 } from "uuid";
import { imagesSelector } from "../../../../annotator/store/selectors/imagesSelector";
import * as malariaAnnotations from "../../../../annotator/images/malaria.json";
import * as cellpaintingAnnotations from "../../../../annotator/images/cellpainting.json";
import { AnnotationType } from "../../../../annotator/types/AnnotationType";
import { SerializedAnnotationType } from "../../../../annotator/types/SerializedAnnotationType";
import { CategoryType } from "../../../../annotator/types/CategoryType";
import { categoriesSelector } from "../../../../annotator/store/selectors";
import { importSerializedAnnotations } from "../../../../annotator/image/imageHelper";

type ExampleImageDialogProps = {
  onClose: () => void;
  open: boolean;
};

export const ExampleImageDialog = ({
  onClose,
  open,
}: ExampleImageDialogProps) => {
  const dispatch = useDispatch();

  const images = useSelector(imagesSelector);

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

    const example: ImageType = {
      avatar: data as string,
      id: v4(),
      annotations: [],
      name: name,
      shape: shape,
      originalSrc: data as string,
      src: data as string,
    };

    let channels: Array<ChannelType> = [];
    for (let i = 0; i < shape.channels; i++) {
      channels.push({ visible: true, range: [0, 255] });
    }

    const newAnnotations: Array<AnnotationType> = [];

    let updatedCategories: Array<CategoryType> = categories_in;

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
        applicationSlice.actions.setImageInstances({
          instances: newAnnotations,
        })
      );
      dispatch(
        applicationSlice.actions.setCategories({
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
