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
import { createProject, projectSlice } from "../../store/slices";
import { useDispatch } from "react-redux";

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
        }); //TODO assign a color to each new category
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

    popupState.close();
  };

  return (
    <MenuItem onClick={onClickExampleProject}>
      Open example project (mnist)
    </MenuItem>
  );
};
