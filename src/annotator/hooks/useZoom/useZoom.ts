import { KonvaEventObject } from "konva/types/Node";
import { useDispatch, useSelector } from "react-redux";
import { ToolType } from "../../types/ToolType";
import { ZoomModeType } from "../../types/ZoomModeType";
import { setOffset, setStageScale, setZoomSelection } from "../../store";
import {
  stageScaleSelector,
  toolTypeSelector,
  zoomSelectionSelector,
  zoomToolOptionsSelector,
} from "../../store/selectors";
import { scaledImageWidthSelector } from "../../store/selectors/scaledImageWidthSelector";

export const useZoom = () => {
  const delta = 10;
  const scaleBy = 1.25;

  const dispatch = useDispatch();

  const stageScale = useSelector(stageScaleSelector);
  const toolType = useSelector(toolTypeSelector);
  const { automaticCentering, mode } = useSelector(zoomToolOptionsSelector);
  const zoomSelection = useSelector(zoomSelectionSelector);

  const imageWidth = useSelector(scaledImageWidthSelector);

  const zoomAndOffset = (
    position: { x: number; y: number } | undefined,
    scaleBy: number,
    zoomIn: boolean = true
  ) => {
    if (!automaticCentering || zoomSelection.dragging) {
      if (!position) return;
      dispatch(
        setOffset({
          offset: {
            x: zoomIn ? position.x * scaleBy : position.x / scaleBy,
            y: zoomIn ? position.y * scaleBy : position.y / scaleBy,
          },
        })
      );
    }
    dispatch(
      setStageScale({
        stageScale: zoomIn ? stageScale * scaleBy : stageScale / scaleBy,
      })
    );
  };

  const deselect = () => {
    dispatch(
      setZoomSelection({
        zoomSelection: {
          maximum: undefined,
          minimum: undefined,
          selecting: false,
          dragging: false,
        },
      })
    );
  };

  const onMouseDown = (position: { x: number; y: number }) => {
    if (toolType !== ToolType.Zoom) return;

    dispatch(
      setZoomSelection({
        zoomSelection: {
          ...zoomSelection,
          dragging: false,
          minimum: position,
          selecting: true,
        },
      })
    );
  };

  const onMouseMove = (position: { x: number; y: number }) => {
    if (mode === ZoomModeType.Out) return;

    if (!zoomSelection.selecting) return;

    if (!position || !zoomSelection.minimum) return;

    dispatch(
      setZoomSelection({
        zoomSelection: {
          ...zoomSelection,
          dragging: Math.abs(position.x - zoomSelection.minimum.x) >= delta,
          maximum: position,
        },
      })
    );
  };

  const onMouseUp = (position: { x: number; y: number }) => {
    if (!imageWidth) return;

    if (!zoomSelection.selecting) return;

    if (zoomSelection.dragging) {
      if (!position) return;

      dispatch(
        setZoomSelection({
          zoomSelection: { ...zoomSelection, maximum: position },
        })
      );

      if (!zoomSelection.minimum) return;

      const selectedWidth = position.x - zoomSelection.minimum.x;

      zoomAndOffset(
        {
          x: zoomSelection.minimum.x + selectedWidth / 2,
          y: zoomSelection.minimum.y + selectedWidth / 2,
        },
        imageWidth / selectedWidth / stageScale
      );
    } else {
      zoomAndOffset(position, scaleBy, mode === ZoomModeType.In);
    }

    dispatch(
      setZoomSelection({
        zoomSelection: { ...zoomSelection, dragging: false, selecting: false },
      })
    );
  };

  const onWheel = (event: KonvaEventObject<WheelEvent>) => {
    if (toolType !== ToolType.Zoom) return;

    if (!imageWidth) return;
    zoomAndOffset(
      { x: imageWidth / 2, y: imageWidth / 2 },
      scaleBy,
      event.evt.deltaY < 0
    );
  };

  return {
    deselect,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onWheel,
  };
};
