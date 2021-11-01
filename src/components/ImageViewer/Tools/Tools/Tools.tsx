import Drawer from "@mui/material/Drawer";
import React from "react";
import { ToolType as OperationType } from "../../../../types/ToolType";
import { Tool } from "../Tool";
import { useStyles } from "./Tools.css";
import { useDispatch, useSelector } from "react-redux";
import { toolTypeSelector } from "../../../../store/selectors";
import { imageViewerSlice } from "../../../../store/slices";
import {
  ColorAdjustmentIcon,
  ColorSelectionIcon,
  EllipticalSelectionIcon,
  HandIcon,
  LassoSelectionIcon,
  MagneticSelectionIcon,
  PenSelectionIcon,
  PolygonalSelectionIcon,
  QuickSelectionIcon,
  RectangularSelectionIcon,
  SelectionIcon,
  ZoomIcon,
} from "../../../../icons";
import { useTranslation } from "../../../../hooks/useTranslation";

export const Tools = () => {
  const classes = useStyles();

  const dispatch = useDispatch();

  const activeOperation = useSelector(toolTypeSelector);

  const t = useTranslation();

  return (
    <Drawer
      anchor="right"
      className={classes.drawer}
      classes={{ paper: classes.paper }}
      variant="permanent"
    >
      <br />
      <Tool
        name={t("Hand")}
        onClick={() => {
          dispatch(
            imageViewerSlice.actions.setOperation({
              operation: OperationType.Hand,
            })
          );
        }}
        selected={activeOperation === OperationType.Hand}
      >
        {/*// @ts-ignore */}
        <HandIcon />
      </Tool>

      <Tool
        name={t("Zoom")}
        onClick={() => {
          dispatch(
            imageViewerSlice.actions.setOperation({
              operation: OperationType.Zoom,
            })
          );
        }}
        selected={activeOperation === OperationType.Zoom}
      >
        {/*// @ts-ignore */}
        <ZoomIcon />
      </Tool>

      <Tool
        name={t("Color Adjustment")}
        onClick={() => {
          dispatch(
            imageViewerSlice.actions.setOperation({
              operation: OperationType.ColorAdjustment,
            })
          );
        }}
        selected={activeOperation === OperationType.ColorAdjustment}
      >
        {/*// @ts-ignore */}
        <ColorAdjustmentIcon />
      </Tool>

      <br />

      <Tool
        name={t("Pointer")}
        onClick={() => {
          dispatch(
            imageViewerSlice.actions.setOperation({
              operation: OperationType.Pointer,
            })
          );
        }}
        selected={activeOperation === OperationType.Pointer}
      >
        {/*// @ts-ignore */}
        <SelectionIcon />
      </Tool>

      <br />
      <Tool
        name={t("Rectangular annotation")}
        onClick={() => {
          dispatch(
            imageViewerSlice.actions.setOperation({
              operation: OperationType.RectangularAnnotation,
            })
          );
        }}
        selected={activeOperation === OperationType.RectangularAnnotation}
      >
        {/*// @ts-ignore */}
        <RectangularSelectionIcon />
      </Tool>

      <Tool
        name={t("Elliptical annotation")}
        onClick={() => {
          dispatch(
            imageViewerSlice.actions.setOperation({
              operation: OperationType.EllipticalAnnotation,
            })
          );
        }}
        selected={activeOperation === OperationType.EllipticalAnnotation}
      >
        {/*// @ts-ignore */}
        <EllipticalSelectionIcon />
      </Tool>

      <Tool
        name={t("Polygonal annotation")}
        onClick={() => {
          dispatch(
            imageViewerSlice.actions.setOperation({
              operation: OperationType.PolygonalAnnotation,
            })
          );
        }}
        selected={activeOperation === OperationType.PolygonalAnnotation}
      >
        {/*// @ts-ignore */}
        <PolygonalSelectionIcon />
      </Tool>

      <br />

      <Tool
        name={t("Freehand annotation")}
        onClick={() => {
          dispatch(
            imageViewerSlice.actions.setOperation({
              operation: OperationType.PenAnnotation,
            })
          );
        }}
        selected={activeOperation === OperationType.PenAnnotation}
      >
        {/*// @ts-ignore */}
        <PenSelectionIcon />
      </Tool>

      <br />

      <Tool
        name={t("Lasso annotation (L)")}
        onClick={() => {
          dispatch(
            imageViewerSlice.actions.setOperation({
              operation: OperationType.LassoAnnotation,
            })
          );
        }}
        selected={activeOperation === OperationType.LassoAnnotation}
      >
        {/*// @ts-ignore */}
        <LassoSelectionIcon />
      </Tool>

      <Tool
        name={t("Magnetic annotation")}
        onClick={() => {
          dispatch(
            imageViewerSlice.actions.setOperation({
              operation: OperationType.MagneticAnnotation,
            })
          );
        }}
        selected={activeOperation === OperationType.MagneticAnnotation}
      >
        {/*// @ts-ignore */}
        <MagneticSelectionIcon />
      </Tool>

      <br />

      <Tool
        name={t("Color annotation")}
        onClick={() => {
          dispatch(
            imageViewerSlice.actions.setOperation({
              operation: OperationType.ColorAnnotation,
            })
          );
        }}
        selected={activeOperation === OperationType.ColorAnnotation}
      >
        {/*// @ts-ignore */}
        <ColorSelectionIcon />
      </Tool>

      <Tool
        name={t("Quick annotation")}
        onClick={() => {
          dispatch(
            imageViewerSlice.actions.setOperation({
              operation: OperationType.QuickAnnotation,
            })
          );
        }}
        selected={activeOperation === OperationType.QuickAnnotation}
      >
        {/*// @ts-ignore */}
        <QuickSelectionIcon />
      </Tool>

      {/*<Tool*/}
      {/*  name={t("Object annotation")}*/}
      {/*  onClick={() => {*/}
      {/*    dispatch(*/}
      {/*      applicationSlice.actions.setOperation({*/}
      {/*        operation: OperationType.ObjectAnnotation,*/}
      {/*      })*/}
      {/*    );*/}
      {/*  }}*/}
      {/*  selected={activeOperation === OperationType.ObjectAnnotation}*/}
      {/*>*/}
      {/*  <ObjectSelectionIcon />*/}
      {/*</Tool>*/}
      <br />
    </Drawer>
  );
};
