"use client";

import { useTheme } from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getLast } from "utils/arrayUtils";
import { TrackVisualizerProps, ValidTracklet } from "../utils/types";
import { generateRelationships } from "../utils/graphUtils";

const HIGHLIGHT_COLOR = "#00d9ff55";
const HOVER_COLOR = "#ffffff55";

export function TrackVisualizer({
  tracks,
  numFrames,
  width = 800,
  height = 400,
  trackHeight = 4,
  trackSpacing = 30,
  selectedTracks,
  toggleSelectedTrack,
}: TrackVisualizerProps) {
  const theme = useTheme();
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    trackId: string;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrolledId = useRef<string | undefined>(undefined);

  const validTracks = useMemo(() => tracks as ValidTracklet[], [tracks]);

  const { positionedTracks, connections, scale, padding } = useMemo(() => {
    return generateRelationships(validTracks, width, trackSpacing, numFrames);
  }, [validTracks, width, height, trackSpacing, numFrames]);

  const svgHeight = useMemo(
    () => Math.max(height, positionedTracks.length * trackSpacing * 1.5 + 50),
    [height, positionedTracks],
  );

  // Scroll to show selected track in the middle when primaryTrack changes
  useEffect(() => {
    if (selectedTracks.length === 0 || !containerRef.current) return;
    const candidateTrackId = getLast(selectedTracks)!;
    // tracks are pushed, so when a new track is selected it becomes the last in the selected list.
    // since the effect fires when the selectedTracklet list changes, we want to avoid scrolling when tracks are deselected
    if (candidateTrackId === lastScrolledId.current) return;
    lastScrolledId.current = candidateTrackId;
    const selectedTrack = positionedTracks.find(
      (track) => track.id === candidateTrackId,
    );
    if (!selectedTrack) return;

    const container = containerRef.current;
    const trackCenterY = selectedTrack.y;
    const containerHeight = container.clientHeight;
    const scrollY = trackCenterY - containerHeight / 2;

    container.scrollTo({
      top: scrollY,
      behavior: "smooth",
    });
  }, [selectedTracks, positionedTracks]);

  const getTrackFillColor = useCallback(
    (trackId: string) => {
      if (selectedTracks.includes(trackId)) {
        return HIGHLIGHT_COLOR;
      }
      return "transparent";
    },
    [selectedTracks],
  );

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent, trackId: string) => {
      const svgRect = (
        e.currentTarget.closest("svg") as SVGElement
      ).getBoundingClientRect();
      setTooltip({
        x: e.clientX - svgRect.left,
        y: e.clientY - svgRect.top - 10,
        trackId,
      });
      if (!selectedTracks.includes(trackId)) {
        e.currentTarget.setAttribute("fill", HOVER_COLOR);
      }
    },
    [selectedTracks],
  );

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent, trackId: string) => {
      setTooltip(null);
      if (!selectedTracks.includes(trackId))
        e.currentTarget.setAttribute("fill", "transparent");
    },
    [selectedTracks],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (tooltip) {
        const svgRect = (
          e.currentTarget.closest("svg") as SVGElement
        ).getBoundingClientRect();
        setTooltip((prev) =>
          prev
            ? {
                ...prev,
                x: e.clientX - svgRect.left,
                y: e.clientY - svgRect.top - 10,
              }
            : null,
        );
      }
    },
    [setTooltip],
  );

  const handleMouseClick = useCallback(
    (e: React.MouseEvent, trackId: string) => {
      toggleSelectedTrack(trackId);
    },
    [toggleSelectedTrack],
  );

  useEffect(() => {
    if (selectedTracks.length === 0) lastScrolledId.current = undefined;
  }, [selectedTracks]);
  return (
    <div
      ref={containerRef}
      style={{
        width: width,
        height: height,
        overflow: "auto",
        position: "relative",
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: "4px",
      }}
    >
      <svg
        width={width}
        height={svgHeight}
        style={{
          backgroundColor: theme.palette.background.default,
        }}
        onMouseMove={handleMouseMove}
      >
        {/* Background */}
        <rect width={width} height={svgHeight} fill="transparent" />

        {/* Grid Lines */}
        {Array.from({ length: numFrames + 1 }, (_, i) => {
          const x = padding + i * scale;
          return (
            <line
              key={i}
              x1={x}
              y1={0}
              x2={x}
              y2={svgHeight}
              stroke="currentColor"
              strokeOpacity={0.1}
              strokeWidth={1}
            />
          );
        })}

        {/* Connection lines (dotted grey lines) */}
        {connections.map((connection, index) => (
          <line
            key={`connection-${index}`}
            x1={connection.from.x}
            y1={connection.from.y}
            x2={connection.to.x}
            y2={connection.to.y}
            stroke="#666"
            strokeWidth={2}
            strokeDasharray="4,4"
            opacity={0.7}
          />
        ))}

        {/* Track lines */}
        {positionedTracks.map((track) => {
          const startX = padding + track.start * scale;
          const endX = padding + track.end * scale;

          return (
            <g key={track.id}>
              {/* Track selection highlight */}
              <rect
                x={startX - 8}
                y={track.y - 8}
                width={endX - startX + 16}
                height={trackHeight + 12}
                fill={getTrackFillColor(track.id)}
                rx={8}
                ry={8}
                strokeLinecap="round"
                style={{
                  cursor: "pointer",
                  transition: "fill 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  handleMouseEnter(e, track.id);
                }}
                onMouseLeave={(e) => handleMouseLeave(e, track.id)}
                onClick={(e) => handleMouseClick(e, track.id)}
              />
              {/* Track line */}
              <rect
                x={startX - 2}
                y={track.y - 2}
                width={endX - startX}
                height={trackHeight}
                fill={track.color}
                stroke={"black"}
                strokeWidth={1}
                strokeLinecap="round"
                style={{
                  pointerEvents: "none",
                }}
              />

              {/* Start/end markers */}
              <circle
                cx={startX}
                cy={track.y}
                r={4}
                fill={"white"}
                stroke="white"
                strokeWidth={1}
                style={{ pointerEvents: "none" }}
              />
              <circle
                cx={endX}
                cy={track.y}
                r={4}
                fill={"white"}
                stroke="white"
                strokeWidth={1}
                style={{ pointerEvents: "none" }}
              />
            </g>
          );
        })}

        <g style={{ fontSize: "12px", fill: "currentColor", opacity: 0.6 }}>
          {Array.from({ length: Math.min(numFrames + 1, 11) }, (_, i) => {
            const frameValue = Math.round(
              (numFrames / Math.min(numFrames, 10)) * i,
            );
            const x = padding + frameValue * scale;
            return (
              <g key={i}>
                <line
                  x1={x}
                  y1={svgHeight - 20}
                  x2={x}
                  y2={svgHeight - 10}
                  stroke="currentColor"
                  strokeWidth={1}
                />
                <text
                  x={x}
                  y={svgHeight - 5}
                  textAnchor="middle"
                  fontSize="10"
                  fill="currentColor"
                >
                  {frameValue}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
      {tooltip && (
        <div
          style={{
            position: "absolute",
            left: tooltip.x,
            top: tooltip.y,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            color: "white",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "12px",
            fontFamily: "monospace",
            pointerEvents: "none",
            zIndex: 1000,
            whiteSpace: "nowrap",
          }}
        >
          {tooltip.trackId}
        </div>
      )}
    </div>
  );
}
