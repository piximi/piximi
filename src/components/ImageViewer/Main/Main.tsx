import Box from "@material-ui/core/Box";
import React from "react";
import { Category } from "../../../types/Category";
import { Image } from "../../../types/Image";
import { ImageViewerOperation } from "../../../types/ImageViewerOperation";
import { useStyles } from "./Main.css";
import { ImageViewerStage } from "../ImageViewerStage";

type MainProps = {
  activeCategory: Category;
  activeOperation: ImageViewerOperation;
  image: Image;
};

export const Main = ({ activeCategory, activeOperation, image }: MainProps) => {
  const classes = useStyles();

  return (
    <main className={classes.content}>
      <div className={classes.toolbar} />

      <Box alignItems="center" display="flex" justifyContent="center">
        <ImageViewerStage
          category={activeCategory}
          data={image}
          operation={activeOperation}
        />
      </Box>
    </main>
  );
};
