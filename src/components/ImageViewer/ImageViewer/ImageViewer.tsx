import React, { useEffect, useState } from "react";
import { Category } from "../../../types/Category";
import { CssBaseline } from "@material-ui/core";
import { Image } from "../../../types/Image";
import { ReactComponent as ColorAdjustmentIcon } from "../../../icons/ColorAdjustment.svg";
import { ReactComponent as EllipticalIcon } from "../../../icons/Elliptical.svg";
import { ReactComponent as LassoIcon } from "../../../icons/Lasso.svg";
import { ReactComponent as MagicWandIcon } from "../../../icons/MagicWand.svg";
import { ReactComponent as ZoomIcon } from "../../../icons/Zoom.svg";
import { ReactComponent as HandIcon } from "../../../icons/Hand.svg";
import { ReactComponent as MagneticIcon } from "../../../icons/Magnetic.svg";
import { ReactComponent as QuickIcon } from "../../../icons/Quick.svg";
import { ReactComponent as ObjectSelectionIcon } from "../../../icons/ObjectSelection.svg";
import { ReactComponent as RectangularIcon } from "../../../icons/Rectangular.svg";
import { ImageViewerOperation } from "../../../types/ImageViewerOperation";
import {
  imagesSelector,
  unknownCategorySelector,
} from "../../../store/selectors";
import { useDispatch, useSelector } from "react-redux";
import { useStyles } from "./ImageViewer.css";
import { projectSlice } from "../../../store/slices";
import { ImageViewerAppBar } from "../ImageViewerAppBar";
import { Categories } from "../Categories";
import { OperationOptions } from "../OperationOptions";
import { SelectionOptions } from "../SelectionOptions";
import { Operations } from "../Operations";
import { Main } from "../Main";
import { ZoomOptions } from "../ZoomOptions";
import { ZoomType } from "../Main/Main";

type ImageViewerProps = {
  image?: Image;
};

export const ImageViewer = (props: ImageViewerProps) => {
  const handleZoomMode = (event: React.ChangeEvent<HTMLInputElement>) => {
    const mode = parseInt((event.target as HTMLInputElement).value);
    setZoomMode(mode);
  };
  const handleRevertZoom = () => {
    setZoomReset(!zoomReset);
  };

  const [zoomMode, setZoomMode] = useState<ZoomType>(ZoomType.In);
  const [zoomReset, setZoomReset] = useState<boolean>(false);

  const operations = [
    {
      description: "Nam a facilisis velit, sit amet interdum ante. In sodales.",
      icon: <ColorAdjustmentIcon />,
      method: ImageViewerOperation.ColorAdjustment,
      name: "Color adjustment",
      settings: <React.Fragment />,
    },
    {
      description: "Nam a facilisis velit, sit amet interdum ante. In sodales.",
      icon: <RectangularIcon />,
      method: ImageViewerOperation.RectangularSelection,
      name: "Rectangular selection",
      settings: <SelectionOptions />,
    },
    {
      description: "Nam a facilisis velit, sit amet interdum ante. In sodales.",
      icon: <EllipticalIcon />,
      method: ImageViewerOperation.EllipticalSelection,
      name: "Elliptical selection",
      settings: <SelectionOptions />,
    },
    {
      description: "Nam a facilisis velit, sit amet interdum ante. In sodales.",
      icon: <EllipticalIcon />,
      method: ImageViewerOperation.PolygonalSelection,
      name: "Polygonal selection",
      settings: <SelectionOptions />,
    },
    {
      description: "Nam a facilisis velit, sit amet interdum ante. In sodales.",
      icon: <LassoIcon />,
      method: ImageViewerOperation.LassoSelection,
      name: "Lasso selection",
      settings: <SelectionOptions />,
    },
    {
      description: "Nam a facilisis velit, sit amet interdum ante. In sodales.",
      icon: <MagneticIcon />,
      method: ImageViewerOperation.MagneticSelection,
      name: "Magnetic selection",
      settings: <SelectionOptions />,
    },
    {
      description: "Nam a facilisis velit, sit amet interdum ante. In sodales.",
      icon: <MagicWandIcon />,
      method: ImageViewerOperation.ColorSelection,
      name: "Color selection",
      settings: <SelectionOptions />,
    },
    {
      description: "Nam a facilisis velit, sit amet interdum ante. In sodales.",
      icon: <QuickIcon />,
      method: ImageViewerOperation.QuickSelection,
      name: "Quick selection",
      settings: <SelectionOptions />,
    },
    {
      description: "Nam a facilisis velit, sit amet interdum ante. In sodales.",
      icon: <ObjectSelectionIcon />,
      method: ImageViewerOperation.ObjectSelection,
      name: "Object selection",
      settings: <SelectionOptions />,
    },
    {
      description: "Nam a facilisis velit, sit amet interdum ante. In sodales.",
      icon: <HandIcon />,
      method: ImageViewerOperation.Hand,
      name: "Hand",
      settings: <React.Fragment />,
    },
    {
      description: "Description of zoom here.",
      icon: <ZoomIcon />,
      method: ImageViewerOperation.Zoom,
      name: "Zoom",
      settings: (
        <ZoomOptions
          zoomMode={zoomMode}
          handleModeChange={handleZoomMode}
          handleRevert={handleRevertZoom}
        />
      ),
    },
  ];

  const [image, setImage] = useState<Image>();

  const images = useSelector(imagesSelector);

  useEffect(() => {
    if (props.image) {
      setImage(props.image);
    } else if (images.length) {
      setImage(images[0]);
    }
  }, [images, props]);

  const [activeOperation, setActiveOperation] = useState<ImageViewerOperation>(
    ImageViewerOperation.RectangularSelection
  );

  const classes = useStyles();

  const unknownCategory = useSelector(unknownCategorySelector);

  const [activeCategory, setActiveCategory] = useState<Category>(
    unknownCategory
  );

  const onCategoryClick = (
    event: React.MouseEvent<HTMLDivElement>,
    category: Category
  ) => {
    setActiveCategory(category);
  };

  return (
    <div className={classes.root}>
      <CssBaseline />

      <ImageViewerAppBar />

      <Categories
        activeCategory={activeCategory}
        onCategoryClick={onCategoryClick}
      />
      
      {image && (
        <Main
          activeCategory={activeCategory}
          activeOperation={activeOperation}
          image={image}
          zoomMode={zoomMode}
          zoomReset={zoomReset}
        />
      )}

      <OperationOptions
        description={
          operations[
            operations.findIndex(
              (operation) => operation.method === activeOperation
            )
          ].description
        }
        name={
          operations[
            operations.findIndex(
              (operation) => operation.method === activeOperation
            )
          ].name
        }
        settings={
          operations[
            operations.findIndex(
              (operation) => operation.method === activeOperation
            )
          ].settings
        }
      />

      <Operations
        activeOperation={activeOperation}
        setActiveOperation={setActiveOperation}
      />
    </div>
  );
};
