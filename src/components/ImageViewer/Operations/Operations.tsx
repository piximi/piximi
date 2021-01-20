import Divider from "@material-ui/core/Divider";
import Drawer from "@material-ui/core/Drawer";
import List from "@material-ui/core/List";
import React from "react";
import { ImageViewerOperation } from "../../../types/ImageViewerOperation";
import { Operation } from "../Operation";
import { ReactComponent as ColorAdjustmentIcon } from "../../../icons/ColorAdjustment.svg";
import { ReactComponent as ColorSelectionIcon } from "../../../icons/ColorSelection.svg";
import { ReactComponent as EllipticalIcon } from "../../../icons/Elliptical.svg";
import { ReactComponent as HandIcon } from "../../../icons/Hand.svg";
import { ReactComponent as LassoIcon } from "../../../icons/Lasso.svg";
import { ReactComponent as MagneticIcon } from "../../../icons/Magnetic.svg";
import { ReactComponent as ObjectSelectionIcon } from "../../../icons/ObjectSelection.svg";
import { ReactComponent as PolygonalSelectionIcon } from "../../../icons/PolygonalSelection.svg";
import { ReactComponent as QuickIcon } from "../../../icons/Quick.svg";
import { ReactComponent as RectangularIcon } from "../../../icons/Rectangular.svg";
import { ReactComponent as ZoomIcon } from "../../../icons/Zoom.svg";
import { useStyles } from "./Operations.css";
import { useDispatch, useSelector } from "react-redux";
import { imageViewerOperationSelector } from "../../../store/selectors";
import { imageViewerSlice } from "../../../store/slices/imageViewerSlice";

export const Operations = () => {
  const classes = useStyles();

  const dispatch = useDispatch();

  const activeOperation = useSelector(imageViewerOperationSelector);

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
            dispatch(
              imageViewerSlice.actions.setImageViewerOperation({
                operation: ImageViewerOperation.ColorAdjustment,
              })
            )
          }
          selected={activeOperation === ImageViewerOperation.ColorAdjustment}
        >
          <ColorAdjustmentIcon />
        </Operation>

        <Divider />

        <Operation
          name="Rectangular selection"
          onClick={() =>
            dispatch(
              imageViewerSlice.actions.setImageViewerOperation({
                operation: ImageViewerOperation.RectangularSelection,
              })
            )
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
            dispatch(
              imageViewerSlice.actions.setImageViewerOperation({
                operation: ImageViewerOperation.EllipticalSelection,
              })
            )
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
            dispatch(
              imageViewerSlice.actions.setImageViewerOperation({
                operation: ImageViewerOperation.LassoSelection,
              })
            )
          }
          selected={activeOperation === ImageViewerOperation.LassoSelection}
        >
          <LassoIcon />
        </Operation>

        <Operation
          name="Polygonal selection"
          onClick={() =>
            dispatch(
              imageViewerSlice.actions.setImageViewerOperation({
                operation: ImageViewerOperation.PolygonalSelection,
              })
            )
          }
          selected={activeOperation === ImageViewerOperation.PolygonalSelection}
        >
          <PolygonalSelectionIcon />
        </Operation>

        <Operation
          name="Magnetic selection"
          onClick={() =>
            dispatch(
              imageViewerSlice.actions.setImageViewerOperation({
                operation: ImageViewerOperation.MagneticSelection,
              })
            )
          }
          selected={activeOperation === ImageViewerOperation.MagneticSelection}
        >
          <MagneticIcon />
        </Operation>

        <Operation
          name="Color selection"
          onClick={() =>
            dispatch(
              imageViewerSlice.actions.setImageViewerOperation({
                operation: ImageViewerOperation.ColorSelection,
              })
            )
          }
          selected={activeOperation === ImageViewerOperation.ColorSelection}
        >
          <ColorSelectionIcon />
        </Operation>

        <Operation
          name="Quick selection"
          onClick={() =>
            dispatch(
              imageViewerSlice.actions.setImageViewerOperation({
                operation: ImageViewerOperation.QuickSelection,
              })
            )
          }
          selected={activeOperation === ImageViewerOperation.QuickSelection}
        >
          <QuickIcon />
        </Operation>

        <Operation
          name="Object selection"
          onClick={() =>
            dispatch(
              imageViewerSlice.actions.setImageViewerOperation({
                operation: ImageViewerOperation.ObjectSelection,
              })
            )
          }
          selected={activeOperation === ImageViewerOperation.ObjectSelection}
        >
          <ObjectSelectionIcon />
        </Operation>

        <Divider />

        <Operation
          name="Zoom"
          onClick={() => {
            dispatch(
              imageViewerSlice.actions.setImageViewerOperation({
                operation: ImageViewerOperation.Zoom,
              })
            );
          }}
          selected={activeOperation === ImageViewerOperation.Zoom}
        >
          <ZoomIcon />
        </Operation>

        <Operation
          name="Hand"
          onClick={() => {
            dispatch(
              imageViewerSlice.actions.setImageViewerOperation({
                operation: ImageViewerOperation.Hand,
              })
            );
          }}
          selected={activeOperation === ImageViewerOperation.Hand}
        >
          <HandIcon />
        </Operation>
      </List>
    </Drawer>
  );
};
