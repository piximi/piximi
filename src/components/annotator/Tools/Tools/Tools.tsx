import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { Drawer } from "@mui/material";

import { useTranslation } from "hooks";

import { Tool } from "../Tool";

import { toolTypeSelector } from "store/selectors";

import { imageViewerSlice } from "store/slices";

import { ToolType as OperationType } from "types";

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
} from "icons";

export const Tools = () => {
  const dispatch = useDispatch();

  const activeOperation = useSelector(toolTypeSelector);

  const t = useTranslation();

  return (
    <Drawer
      anchor="right"
      sx={{
        flexShrink: 0,
        whiteSpace: "nowrap",
        width: 56,
        "& > .MuiDrawer-paper": {
          width: 56,
        },
      }}
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
        <QuickSelectionIcon />
      </Tool>

      <Tool
        name="Threshold annotation"
        onClick={() => {
          dispatch(
            imageViewerSlice.actions.setOperation({
              operation: OperationType.ThresholdAnnotation,
            })
          );
        }}
        selected={activeOperation === OperationType.ThresholdAnnotation}
      >
        <RectangularSelectionIcon />
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
