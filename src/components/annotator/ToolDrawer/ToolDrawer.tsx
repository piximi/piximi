import React, { ReactElement } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Divider, Drawer } from "@mui/material";

import { useTranslation } from "hooks";

import { Tool } from "../Tool";

import { AnnotatorSlice, toolTypeSelector } from "store/annotator";

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

const toolMap: Record<
  string,
  { operation: OperationType; icon: ReactElement }
> = {
  Hand: { operation: OperationType.Hand, icon: <HandIcon /> },
  Zoom: { operation: OperationType.Zoom, icon: <ZoomIcon /> },
  "Color Adjustment": {
    operation: OperationType.ColorAdjustment,
    icon: <ColorAdjustmentIcon />,
  },
  Pointer: { operation: OperationType.Pointer, icon: <SelectionIcon /> },
  "Rectangular annotation": {
    operation: OperationType.RectangularAnnotation,
    icon: <RectangularSelectionIcon />,
  },
  "Elliptical annotation": {
    operation: OperationType.EllipticalAnnotation,
    icon: <EllipticalSelectionIcon />,
  },
  "Polygonal annotation": {
    operation: OperationType.PolygonalAnnotation,
    icon: <PolygonalSelectionIcon />,
  },
  "Freehand annotation": {
    operation: OperationType.PenAnnotation,
    icon: <PenSelectionIcon />,
  },
  "Lasso annotation (L)": {
    operation: OperationType.LassoAnnotation,
    icon: <LassoSelectionIcon />,
  },
  "Magnetic annotation": {
    operation: OperationType.MagneticAnnotation,
    icon: <MagneticSelectionIcon />,
  },
  "Color annotation": {
    operation: OperationType.ColorAnnotation,
    icon: <ColorSelectionIcon />,
  },
  "Quick annotation": {
    operation: OperationType.QuickAnnotation,
    icon: <QuickSelectionIcon />,
  },
  "Threshold annotation": {
    operation: OperationType.ThresholdAnnotation,
    icon: <RectangularSelectionIcon />,
  },
};
export const ToolDrawer = () => {
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
      {Object.keys(toolMap).map((name, idx) => {
        return (
          <React.Fragment key={`${name}_${idx}`}>
            <Tool
              name={t(name)}
              onClick={() => {
                dispatch(
                  AnnotatorSlice.actions.setOperation({
                    operation: toolMap[name].operation,
                  })
                );
              }}
              selected={activeOperation === toolMap[name].operation}
            >
              {toolMap[name].icon}
            </Tool>
            {[
              "Color Adjustment",
              "Pointer",
              "Polygonal annotation",
              "Freehand annotation",
              "Magnetic annotation",
            ].includes(name) && <Divider sx={{ margin: "0.5rem 0" }} />}
          </React.Fragment>
        );
      })}

      {/* <Tool
        name={t("Object annotation")}
       onClick={() => {
          dispatch(applicationSlice.actions.setOperation({ operation: OperationType.ObjectAnnotation, }) );
      }}
        selected={activeOperation === OperationType.ObjectAnnotation}
      >
        <ObjectSelectionIcon />
      </Tool> */}
      <br />
    </Drawer>
  );
};
