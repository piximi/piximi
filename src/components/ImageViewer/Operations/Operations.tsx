import Divider from "@material-ui/core/Divider";
import Drawer from "@material-ui/core/Drawer";
import List from "@material-ui/core/List";
import React from "react";
import { ReactComponent as ColorAdjustmentIcon } from "../../../icons/ColorAdjustment.svg";
import { ReactComponent as EllipticalIcon } from "../../../icons/Elliptical.svg";
import { ReactComponent as LassoIcon } from "../../../icons/Lasso.svg";
import { ReactComponent as ZoomIcon } from "../../../icons/Zoom.svg";
import { ReactComponent as HandIcon } from "../../../icons/Hand.svg";
import { ReactComponent as MagneticIcon } from "../../../icons/Magnetic.svg";
import { ReactComponent as QuickIcon } from "../../../icons/Quick.svg";
import { ReactComponent as RectangularIcon } from "../../../icons/Rectangular.svg";
import { ReactComponent as ObjectSelectionIcon } from "../../../icons/ObjectSelection.svg";
import { ImageViewerOperation } from "../../../types/ImageViewerOperation";
import { useStyles } from "./Operations.css";
import { Operation } from "../Operation";

type ImageViewerProps = {
  activeOperation: ImageViewerOperation;
  setActiveOperation: (operation: ImageViewerOperation) => void;
};

export const Operations = ({
  activeOperation,
  setActiveOperation,
}: ImageViewerProps) => {
  const classes = useStyles();

  return (
    <Drawer
      anchor="right"
      className={classes.drawer}
      classes={{ paper: classes.paper }}
      variant="permanent"
    >
      <div className={classes.toolbar} />

      <Divider />

      <List>
        <Operation
          name="Color adjustment"
          onClick={() =>
            setActiveOperation(ImageViewerOperation.ColorAdjustment)
          }
          selected={activeOperation === ImageViewerOperation.ColorAdjustment}
        >
          <ColorAdjustmentIcon />
        </Operation>

        <Divider />

        <Operation
          name="Rectangular selection"
          onClick={() =>
            setActiveOperation(ImageViewerOperation.RectangularSelection)
          }
          selected={
            activeOperation === ImageViewerOperation.RectangularSelection
          }
        >
          <RectangularIcon />
        </Operation>

        <Operation
          name="Elliptical selection"
          onClick={() =>
            setActiveOperation(ImageViewerOperation.EllipticalSelection)
          }
          selected={
            activeOperation === ImageViewerOperation.EllipticalSelection
          }
        >
          <EllipticalIcon />
        </Operation>

        <Operation
          name="Lasso selection"
          onClick={() =>
            setActiveOperation(ImageViewerOperation.LassoSelection)
          }
          selected={activeOperation === ImageViewerOperation.LassoSelection}
        >
          <LassoIcon />
        </Operation>

        <Operation
          name="Polygonal selection"
          onClick={() =>
            setActiveOperation(ImageViewerOperation.PolygonalSelection)
          }
          selected={activeOperation === ImageViewerOperation.PolygonalSelection}
        >
          <EllipticalIcon />
        </Operation>

        <Operation
          name="Magnetic selection"
          onClick={() =>
            setActiveOperation(ImageViewerOperation.MagneticSelection)
          }
          selected={activeOperation === ImageViewerOperation.MagneticSelection}
        >
          <MagneticIcon />
        </Operation>

        <Operation
          name="Color selection"
          onClick={() =>
            setActiveOperation(ImageViewerOperation.ColorSelection)
          }
          selected={activeOperation === ImageViewerOperation.ColorSelection}
        >
          <MagneticIcon />
        </Operation>

        <Operation
          name="Quick selection"
          onClick={() =>
            setActiveOperation(ImageViewerOperation.QuickSelection)
          }
          selected={activeOperation === ImageViewerOperation.QuickSelection}
        >
          <QuickIcon />
        </Operation>

        <Operation
          name="Object selection"
          onClick={() =>
            setActiveOperation(ImageViewerOperation.ObjectSelection)
          }
          selected={activeOperation === ImageViewerOperation.ObjectSelection}
        >
          <ObjectSelectionIcon />
        </Operation>

        <Divider />

        <Operation
          name="Zoom"
          onClick={() => setActiveOperation(ImageViewerOperation.Zoom)}
          selected={activeOperation === ImageViewerOperation.Zoom}
        >
          <ZoomIcon />
        </Operation>

        <Operation
          name="Hand"
          onClick={() => setActiveOperation(ImageViewerOperation.Hand)}
          selected={activeOperation === ImageViewerOperation.Hand}
        >
          <HandIcon />
        </Operation>
      </List>
    </Drawer>
  );
};
