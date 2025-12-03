"use client";

import { useTheme } from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { arrayRange, getLast } from "utils/arrayUtils";
import { TrackVisualizerProps, ValidTracklet } from "../utils/types";
import { generateRelationships } from "../utils/graphUtils";
import { batch, useDispatch } from "react-redux";
import { dataSlice } from "store/data";
import { trackEditingSlice } from "views/ImageViewer/state/tracklet-editing/trackletEditingSlice";

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
  managementSession,
}: TrackVisualizerProps) {
  const theme = useTheme();
  const dispatch = useDispatch();
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

  const maxTrackletY = useMemo(
    () =>
      positionedTracks.reduce((maxY: number, tracklet) => {
        if (tracklet.y > maxY) maxY = tracklet.y;
        return maxY;
      }, 0),
    [positionedTracks],
  );

  const svgHeight = useMemo(
    () => Math.max(height, maxTrackletY + trackSpacing),
    [height, maxTrackletY],
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
    (e: React.MouseEvent, trackId: string, trackName?: string) => {
      const svgRect = (
        e.currentTarget.closest("svg") as SVGElement
      ).getBoundingClientRect();
      setTooltip({
        x: e.clientX - svgRect.left,
        y: e.clientY - svgRect.top - 10,
        trackId: trackName ?? trackId,
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
  const handleSeverHover = useCallback(
    (e: React.MouseEvent, timepoint: number) => {
      const svgRect = (
        e.currentTarget.closest("svg") as SVGElement
      ).getBoundingClientRect();
      const severRect = e.currentTarget.getBoundingClientRect();
      const severCenter = (severRect.right + severRect.left) / 2;
      setTooltip({
        x: Math.round(severCenter) - svgRect.left,
        y: Math.round(severRect.bottom) - svgRect.top,
        trackId: `${timepoint - 0.5} <-/-> ${timepoint + 0.5}`,
      });

      e.currentTarget.setAttribute("fill", HOVER_COLOR);
    },
    [],
  );

  const handleSeverLeave = useCallback((e: React.MouseEvent) => {
    setTooltip(null);
    e.currentTarget.setAttribute("fill", "transparent");
  }, []);

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
      if (managementSession.mode === null) {
        toggleSelectedTrack(trackId);
        return;
      }
      // if (["join", "create", "remove"].includes(managementSession.mode)) {
      //   if (!managementSession.primaryTracklet) {
      //     dispatch(
      //       trackEditingSlice.actions.setPrimaryManagementTracklet(
      //         tracks.find((track) => track.id === trackId)!,
      //       ),
      //     );
      //     toggleSelectedTrack(trackId);
      //     return;
      //   } else if (trackId === managementSession.primaryTracklet.id) {
      //     dispatch(
      //       trackEditingSlice.actions.setPrimaryManagementTracklet(undefined),
      //     );
      //     toggleSelectedTrack(trackId);
      //     return;
      //   }
      // }

      const handlePrimarySelection = () => {
        if (!managementSession.primaryTracklet) {
          dispatch(
            trackEditingSlice.actions.setPrimaryManagementTracklet(
              tracks.find((track) => track.id === trackId)!,
            ),
          );
          toggleSelectedTrack(trackId);
          return true;
        } else if (trackId === managementSession.primaryTracklet.id) {
          dispatch(
            trackEditingSlice.actions.setPrimaryManagementTracklet(undefined),
          );
          toggleSelectedTrack(trackId);
          return true;
        }
        return false;
      };

      switch (managementSession.mode) {
        case "create":
          if (!handlePrimarySelection())
            dispatch(
              dataSlice.actions.createTrackletRelationship({
                trackletId1: managementSession.primaryTracklet!.id,
                trackletId2: trackId,
              }),
            );
          break;
        case "remove":
          if (!handlePrimarySelection())
            dispatch(
              dataSlice.actions.removeTrackletRelationship({
                trackletId1: managementSession.primaryTracklet!.id,
                trackletId2: trackId,
              }),
            );
          break;
        case "join":
          if (!handlePrimarySelection()) {
            toggleSelectedTrack(managementSession.primaryTracklet!.id);
            batch(() => {
              dispatch(
                dataSlice.actions.joinTracklets({
                  primaryTracklet: managementSession.primaryTracklet!.id,
                  joinedTracklet: trackId,
                }),
              );
              dispatch(
                trackEditingSlice.actions.setPrimaryManagementTracklet(
                  undefined,
                ),
              );
            });
          }
          break;
        default:
          break;
      }
    },
    [toggleSelectedTrack, managementSession],
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
                  managementSession.mode !== "sever" &&
                    handleMouseEnter(e, track.id, track.name);
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
              {/* Sever Marks */}
              {arrayRange(track.end - track.start - 2).map((x) => {
                const severPoint = track.start + 1 + x + 0.5;
                const xPlace = padding + severPoint * scale;
                return (
                  <g key={`${track.id}-sever-${xPlace}`}>
                    {/* Invisible larger hit area */}
                    <rect
                      x={xPlace - 10}
                      y={track.y - 12}
                      width={20}
                      height={26}
                      rx={4}
                      ry={4}
                      fill="transparent"
                      style={{
                        cursor: "crosshair",
                        pointerEvents:
                          managementSession.mode === "sever" ? "auto" : "none",
                      }}
                      onMouseEnter={(e) => handleSeverHover(e, severPoint)}
                      onMouseLeave={handleSeverLeave}
                      onClick={() =>
                        dispatch(
                          dataSlice.actions.severTracklet({
                            id: track.id,
                            timepoint: severPoint,
                          }),
                        )
                      }
                    />
                    {/* Visible red line */}
                    <line
                      x1={xPlace + 3}
                      x2={xPlace - 3}
                      y1={track.y - 7}
                      y2={track.y + 9}
                      stroke="red"
                      strokeWidth={3}
                      strokeLinecap="round"
                      style={{
                        pointerEvents: "none",
                        visibility:
                          managementSession.mode === "sever"
                            ? "visible"
                            : "hidden",
                      }}
                    />
                  </g>
                );
              })}
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
            transform: "translateX(-50%)",
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
