import type { PointerEvent } from "react";
import { useCallback, useMemo, useRef } from "react";

import { useDispatch } from "react-redux";

import * as d3 from "d3";

import { dataSliceV2 } from "store/dataV2";

import { DIMENSIONS } from "utils/constants";

import {
  clamp,
  maxBinCount,
  rampPlotPoints,
  RampHandle,
} from "./histogramUtils";

import type { RampPoint } from "./histogramUtils";

const HISTOGRAM_MARGINS = {
  top: 18,
  right: 10,
  bottom: 30, // includes space for x-axis
  left: 25,
};
const HISTOGRAM_HEIGHT = 145;
const HISTOGRAM_WIDTH = DIMENSIONS.leftDrawerWidth - 16;
const RAMP_GRADIENT_MAX_OPACITY = 0.75;
const HISTOGRAM_NUM_TICKS = 4;
const MOUSE_EVENT_BUTTONS_PRIMARY = 1;
/**
 * If the first or last "round" tick mark is within this ratio of the end of the x axis,
 * remove it to get it out of the way of the tick mark right at the end.
 *
 * For instance, if the x range is [0, 255], the last tick mark d3 generates will likely be at 250.
 * That should be removed to get it out of the way of the tick mark at 255!
 * But if the range is [0, 390], it may be that the last tick mark is at 300.
 * It would make no sense to remove that tick mark to make space for one at 390.
 */
const HISTOGRAM_END_TICK_MARGIN = 0.1;

/** Defines an SVG gradient with id `id` based on the provided `ramp` values */
const RampGradientDef = ({
  rampPoints: rampPoints,
  id,
}: {
  rampPoints: RampPoint[];
  id: string;
}) => {
  const range = rampPoints[rampPoints.length - 1].x - rampPoints[0].x;
  return (
    <defs>
      <linearGradient
        id={id}
        gradientUnits="objectBoundingBox"
        spreadMethod="pad"
        x2="100%"
      >
        {rampPoints.map((cp, i) => {
          const offset = `${((cp.x - rampPoints[0].x) / range) * 100}%`;
          const opacity = Math.min(cp.opacity, RAMP_GRADIENT_MAX_OPACITY);
          return (
            <stop
              key={i}
              stopColor="#fff"
              stopOpacity={opacity}
              offset={offset}
            />
          );
        })}
      </linearGradient>
    </defs>
  );
};

const sliderHandleSymbol: d3.SymbolType = {
  draw: (context, size) => {
    // size is symbol area in px^2
    const height = Math.sqrt(size * 1.9);
    const triangleHeight = height * 0.4;
    const halfWidth = height * 0.325;

    context.moveTo(-halfWidth, -height);
    context.lineTo(halfWidth, -height);
    context.lineTo(halfWidth, -triangleHeight);
    context.lineTo(0, 0);
    context.lineTo(-halfWidth, -triangleHeight);
    context.closePath();
  },
};
/** d3-generated svg data string representing the "basic mode" min/max slider handles */
const sliderHandlePath =
  d3.symbol().type(sliderHandleSymbol).size(80)() ?? undefined;
export const Histogram = ({
  id,
  histogram,
  pixelMin,
  pixelMax,
  rampMin,
  rampMax,
  plotMin,
  plotMax,
}: {
  id: string;
  histogram: ArrayBuffer;
  pixelMin: number;
  pixelMax: number;
  rampMin: number;
  rampMax: number;
  plotMin: number;
  plotMax: number;
}) => {
  const dispatch = useDispatch();
  const svgRef = useRef<SVGSVGElement>(null);

  const innerWidth =
    HISTOGRAM_WIDTH - HISTOGRAM_MARGINS.left - HISTOGRAM_MARGINS.right;
  const innerHeight =
    HISTOGRAM_HEIGHT - HISTOGRAM_MARGINS.top - HISTOGRAM_MARGINS.bottom;

  const pointsToRender = useMemo(
    () => rampPlotPoints(rampMin, rampMax, plotMin, plotMax),
    [rampMin, rampMax, plotMin, plotMax],
  );

  // d3 scales define the mapping between data and screen space (and do the heavy lifting of generating plot axes)
  const xScale = useMemo(
    () => d3.scaleLinear().domain([plotMin, plotMax]).range([0, innerWidth]),
    [innerWidth, plotMin, plotMax],
  );
  const yScale = useMemo(
    () => d3.scaleLinear().domain([0, 1]).range([innerHeight, 0]),
    [innerHeight],
  );

  /** d3-generated svg data string representing both the line between points and the region filled with gradient */
  const areaPath = useMemo(() => {
    const areaGenerator = d3
      .area<RampPoint>()
      .x((d) => xScale(d.x))
      .y0((d) => yScale(d.opacity))
      .y1(innerHeight)
      .curve(d3.curveLinear);
    return areaGenerator(pointsToRender) ?? undefined;
  }, [pointsToRender, xScale, yScale, innerHeight]);

  const xAxisRef = useCallback(
    (el: SVGGElement) => {
      // generate tick marks
      const ticks = xScale.ticks(HISTOGRAM_NUM_TICKS);

      // make sure we have sensible tick marks right at the min and max of the x axis
      const [min, max] = xScale.domain();
      const domain = max - min;

      if ((ticks[0] - min) / domain < HISTOGRAM_END_TICK_MARGIN) {
        ticks[0] = min;
      } else {
        ticks.unshift(min);
      }

      if (
        (ticks[ticks.length - 1] - min) / domain >
        1 - HISTOGRAM_END_TICK_MARGIN
      ) {
        ticks[ticks.length - 1] = max;
      } else {
        ticks.push(max);
      }

      d3.select(el).call(
        d3.axisBottom(xScale).tickValues(ticks).tickPadding(10), // get tick labels out of the way of sliders
      );
    },
    [xScale],
  );

  const yAxisRef = useCallback(
    (el: SVGGElement) =>
      d3.select(el).call(d3.axisLeft(yScale).ticks(HISTOGRAM_NUM_TICKS)),
    [yScale],
  );

  const histogramRef = useCallback(
    (el: SVGGElement) => {
      if (el === null) {
        return;
      }
      const histArray = new Uint32Array(histogram);
      const numBins = histArray.length;
      if (numBins < 1) {
        return;
      }

      const binSize = (pixelMax - pixelMin) / numBins;
      const toFractionalBin = (v: number) => (v - pixelMin) / binSize;
      const binIndexToValue = (i: number) => pixelMin + i * binSize;
      const plotMinBin = toFractionalBin(plotMin);
      const plotMaxBin = toFractionalBin(plotMax);

      const start = Math.max(0, Math.ceil(plotMinBin));
      const end = Math.min(numBins, Math.floor(plotMaxBin));
      const binLengthsToRender = histArray.subarray(start, end);
      const max = maxBinCount(binLengthsToRender);
      const barWidth = innerWidth / (plotMaxBin - plotMinBin);
      const binScale = d3
        .scaleLog()
        .domain([0.1, max])
        .range([innerHeight, 0])
        .base(2)
        .clamp(true);

      d3.select(el)
        .selectAll(".bar") // select all the bars of the histogram
        .data(binLengthsToRender) // bind the histogram bins to this selection
        .join("rect") // ensure we have exactly as many bound `rect` elements in the DOM as we have histogram bins
        .attr("fill", "var(--mui-palette-divider)")
        .attr("class", "bar")
        .attr("width", barWidth)
        .attr("x", (_len, idx) => xScale(binIndexToValue(idx + start))) // set position and height from data
        .attr("y", (len) => binScale(len))
        .attr("height", (len) => innerHeight - binScale(len));
    },
    [
      histogram,
      innerWidth,
      innerHeight,
      pixelMin,
      pixelMax,
      xScale,
      plotMax,
      plotMin,
    ],
  );

  const mouseEventToPlotValues = (
    event: MouseEvent | React.MouseEvent,
  ): number => {
    const svgRect = svgRef.current?.getBoundingClientRect() ?? { x: 0, y: 0 };
    return xScale.invert(
      clamp(event.clientX - svgRect.x - HISTOGRAM_MARGINS.left, 0, innerWidth),
    );
  };

  const draggedPointIdxRef = useRef<RampHandle | null>(null);

  const dragSlider = (handle: RampHandle, x: number): void => {
    if (handle === RampHandle.Min) {
      dispatch(
        dataSliceV2.actions.updateChannelMeta({
          id,
          changes: { rampMin: Math.min(x, rampMax) },
        }),
      );
    } else {
      dispatch(
        dataSliceV2.actions.updateChannelMeta({
          id,
          changes: { rampMax: Math.max(x, rampMin) },
        }),
      );
    }
  };

  const handlePlotPointerDown = (event: PointerEvent<SVGSVGElement>) => {
    if (event.button === 0 && draggedPointIdxRef.current !== null) {
      event.preventDefault();

      // get set up to drag the point around, even if the mouse leaves the SVG element
      event.currentTarget.setPointerCapture(event.nativeEvent.pointerId);
    } else {
      draggedPointIdxRef.current = null;
    }
  };

  const handlePlotPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (draggedPointIdxRef.current === null) {
      return;
    }
    if ((event.buttons & MOUSE_EVENT_BUTTONS_PRIMARY) === 0) {
      handleDragEnd(event);
      return;
    }
    event.stopPropagation();
    event.preventDefault();
    const x = mouseEventToPlotValues(event);

    dragSlider(draggedPointIdxRef.current, x);
  };

  const handleDragEnd = (event: PointerEvent<SVGSVGElement>) => {
    draggedPointIdxRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const handleRampMarkerClick = useCallback(
    (
      event: PointerEvent<SVGLineElement | SVGPathElement>,
      handle: RampHandle,
    ) => {
      event.stopPropagation();
      event.preventDefault();
      draggedPointIdxRef.current = handle;
    },
    [],
  );

  return (
    <svg
      ref={svgRef}
      width={HISTOGRAM_WIDTH}
      height={HISTOGRAM_HEIGHT}
      onPointerDown={handlePlotPointerDown}
      onPointerMove={handlePlotPointerMove}
      onPointerUp={handleDragEnd}
    >
      <g
        transform={`translate(${HISTOGRAM_MARGINS.left},${HISTOGRAM_MARGINS.top})`}
      >
        <RampGradientDef rampPoints={pointsToRender} id={`tfGradient-${id}`} />
        <g ref={histogramRef} />
        <path fill={`url(#tfGradient-${id})`} d={areaPath} />
        <g ref={xAxisRef} transform={`translate(0,${innerHeight})`} />
        <g ref={yAxisRef} />
        {[
          { value: rampMin, handle: RampHandle.Min, atBottom: true },
          { value: rampMax, handle: RampHandle.Max, atBottom: false },
        ].map(
          ({ value, handle, atBottom }) =>
            plotMin <= rampMin &&
            rampMin <= plotMax && (
              <g key={handle} transform={`translate(${xScale(value)})`}>
                <line
                  y1={innerHeight}
                  strokeDasharray="5,5"
                  strokeWidth={2}
                  stroke={"var(--mui-palette-secondary-main)"}
                  cursor="ew-resize"
                />
                <line
                  y1={innerHeight}
                  strokeWidth={8}
                  stroke="transparent"
                  cursor="ew-resize"
                  onPointerDown={(e) => handleRampMarkerClick(e, handle)}
                />
                <path
                  d={sliderHandlePath}
                  transform={
                    atBottom
                      ? `translate(0,${innerHeight}) rotate(180)`
                      : undefined
                  }
                  fill={"var(--mui-palette-secondary-main)"}
                  cursor="ew-resize"
                  onPointerDown={(e) => handleRampMarkerClick(e, handle)}
                />
              </g>
            ),
        )}
      </g>
    </svg>
  );
};
