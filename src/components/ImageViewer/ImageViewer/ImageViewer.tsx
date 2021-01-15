import Box from "@material-ui/core/Box";
import Divider from "@material-ui/core/Divider";
import Drawer from "@material-ui/core/Drawer";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import React, { useState } from "react";
import SvgIcon from "@material-ui/core/SvgIcon";
import Tooltip from "@material-ui/core/Tooltip";
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
import { ImageViewerStage } from "../ImageViewerStage";
import { SelectionOptions } from "../SelectionOptions";
import { Operations } from "../Operations";

type ImageViewerProps = {
  foo: Image;
};

export const ImageViewer = ({ foo }: ImageViewerProps) => {
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
      description: "Nam a facilisis velit, sit amet interdum ante. In sodales.",
      icon: <ZoomIcon />,
      method: ImageViewerOperation.Zoom,
      name: "Zoom",
      settings: <React.Fragment />,
    },
  ];

  const dispatch = useDispatch();

  // TODO: Testing code, please remove ASAP
  React.useEffect(() => {
    const payload = { shape: foo.shape!, src: foo.src };

    dispatch(projectSlice.actions.createImage(payload));
  }, [foo, dispatch]);

  const images = useSelector(imagesSelector);

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

      <main className={classes.content}>
        <div className={classes.toolbar} />

        <Box alignItems="center" display="flex" justifyContent="center">
          <ImageViewerStage
            operation={activeOperation}
            data={images[0]}
            category={activeCategory}
          />
        </Box>
      </main>

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
