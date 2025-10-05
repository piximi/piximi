"use client";

import { useTheme } from "@mui/material";
import { difference } from "lodash";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Tracklet } from "store/data/types";
import { RequireField } from "utils/types";
import { TrackVisualizerProps, ValidTracklet } from "./types";
import { generateRelationships } from "./utils";

const TRACKS = [
  {
    trackId: "A",
    color: "#9C7BB0",
    linkedIds: [
      "1a50f392-11d7-415d-9f75-421095b1adf5",
      "145385fa-df77-42f6-88f6-0fee2c2cb901",
      "11264e96-16ba-4438-9faf-c01f2c009359",
      "15684d55-8a45-47b5-a359-bf26858f48d2",
    ],
    start: 0,
    end: 3,
    children: ["B", "C"],
  },
  {
    trackId: "B",
    color: "#655649",
    linkedIds: [
      "1269216e-158d-49ea-be20-841bb9a3cc3f",
      "1bbc6496-c3eb-4aaf-a573-521bd582cc56",
      "1bffff63-209d-4f5d-a797-31010c74a597",
      "1409c11f-e876-4b4b-9737-1dfd490c1b09",
      "1d108145-bb47-49d9-8c5c-f2af5700afef",
      "1ef8bebd-18f3-438b-b9c3-e8391e5d6518",
    ],
    start: 4,
    end: 9,
    parents: ["A"],
    children: ["G", "H", "I"],
    //children: ["G", "H"],
  },
  {
    trackId: "C",
    color: "#074B41",
    linkedIds: [
      "1907f9df-3bab-441f-b9db-bf21a4372f8c",
      "1e10dc19-1c21-4493-8543-ad012b676723",
      "12b72cc9-b9ea-4e26-a450-51a66b422222",
      "10efa85a-c27a-454b-8dac-5c7a94bdbf29",
      "1151d57c-748e-4ddd-8241-10f79ad58d9e",
      "15af02c5-bd39-4db0-b9c6-963b8cf8c612",
    ],
    start: 4,
    end: 9,
    parents: ["A"],
    children: ["D", "E"],
  },
  {
    trackId: "D",
    color: "#CFC80F",
    linkedIds: [
      "17d0debe-9dea-4f7d-8748-e8f452cc9c99",
      "1db3fea6-e291-457a-bb9b-90274d205b1a",
      "18ea2761-58ca-453d-9d5c-7a1addbfae9b",
      "16017361-e1bb-4820-962e-190461d6d9ee",
      "16ab0135-16d9-450c-9487-93f2e53f6006",
    ],
    start: 10,
    end: 14,
    parents: ["C"],
    children: ["F"],
  },
  {
    trackId: "E",
    color: "#D2B5CF",
    linkedIds: [
      "1c9b79c1-d632-4300-8a40-f21e1603ceda",
      "14852c4e-8802-4f75-afd8-3b83ceec5a20",
      "16ac923e-c1d8-47e7-8eae-ec2f877c316d",
      "11253005-defb-4209-a061-163f96b658c0",
      "17a709d4-1335-4678-9efe-9fff85fc3e7a",
    ],
    start: 10,
    end: 14,
    parents: ["C"],
    children: ["F"],
  },
  {
    trackId: "F",
    color: "#3DE1F0",
    linkedIds: [
      "1419cdea-f2a0-49d8-94af-b40b2d873aa1",
      "1b9a3241-a630-4c24-8935-1ea8c86d9bb1",
      "19da2356-8c49-4ea7-badb-3258a8c03423",
      "196f0302-6116-424a-a339-328fcf515a3a",
    ],
    start: 15,
    end: 18,
    parents: ["D", "E"],
    //children: ["J", "K"],
    //children: ["J"],
  },
  {
    trackId: "G",
    color: "#CFC80F",
    linkedIds: [
      "17d0debe-9dea-4f7d-8748-e8f452cc9c99",
      "1db3fea6-e291-457a-bb9b-90274d205b1a",
      "18ea2761-58ca-453d-9d5c-7a1addbfae9b",
      "16017361-e1bb-4820-962e-190461d6d9ee",
      "16ab0135-16d9-450c-9487-93f2e53f6006",
    ],
    start: 10,
    end: 14,
    parents: ["B"],
  },
  {
    trackId: "H",
    color: "#D2B5CF",
    linkedIds: [
      "1c9b79c1-d632-4300-8a40-f21e1603ceda",
      "14852c4e-8802-4f75-afd8-3b83ceec5a20",
      "16ac923e-c1d8-47e7-8eae-ec2f877c316d",
      "11253005-defb-4209-a061-163f96b658c0",
      "17a709d4-1335-4678-9efe-9fff85fc3e7a",
    ],
    start: 10,
    end: 14,
    parents: ["B"],
  },
  {
    trackId: "I",
    color: "#D2B5CF",
    linkedIds: [
      "1c9b79c1-d632-4300-8a40-f21e1603ceda",
      "14852c4e-8802-4f75-afd8-3b83ceec5a20",
      "16ac923e-c1d8-47e7-8eae-ec2f877c316d",
      "11253005-defb-4209-a061-163f96b658c0",
      "17a709d4-1335-4678-9efe-9fff85fc3e7a",
    ],
    start: 10,
    end: 14,
    parents: ["B"],
  },
  // {
  //   trackId: "J",
  //   color: "#D2B5CF",
  //   linkedIds: [
  //     "1c9b79c1-d632-4300-8a40-f21e1603ceda",
  //     "14852c4e-8802-4f75-afd8-3b83ceec5a20",
  //     "16ac923e-c1d8-47e7-8eae-ec2f877c316d",
  //     "11253005-defb-4209-a061-163f96b658c0",
  //     "17a709d4-1335-4678-9efe-9fff85fc3e7a",
  //   ],
  //   start: 19,
  //   end: 21,
  //   parents: ["F"],
  // },
  // {
  //   trackId: "K",
  //   color: "#D2B5CF",
  //   linkedIds: [
  //     "1c9b79c1-d632-4300-8a40-f21e1603ceda",
  //     "14852c4e-8802-4f75-afd8-3b83ceec5a20",
  //     "16ac923e-c1d8-47e7-8eae-ec2f877c316d",
  //     "11253005-defb-4209-a061-163f96b658c0",
  //     "17a709d4-1335-4678-9efe-9fff85fc3e7a",
  //   ],
  //   start: 19,
  //   end: 21,
  //   parents: ["F"],
  // },
];

const HOVERED_TRACK_HEIGHT = 6;
const CLICKED_TRACK_HEIGHT = 8;

export function TrackVisualizer({
  tracks,
  numFrames,
  width = 800,
  height = 400,
  trackHeight = 4,
  trackSpacing = 30,
  primaryTrack,
  setPrimaryTrack,
  secondaryTracks,
  setSecondaryTracks,
}: TrackVisualizerProps) {
  const theme = useTheme();
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    trackId: string;
  } | null>(null);

  const validTracks = useMemo(() => tracks as ValidTracklet[], [tracks]);
  const { positionedTracks, connections, scale, padding } = useMemo(() => {
    return generateRelationships(validTracks, width, trackSpacing, numFrames);
  }, [validTracks, width, height, trackSpacing, numFrames]);

  const svgHeight = Math.max(
    height,
    positionedTracks.length * trackSpacing + 100,
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
      if (trackId !== primaryTrack && !secondaryTracks.includes(trackId)) {
        e.currentTarget.setAttribute(
          "stroke-width",
          HOVERED_TRACK_HEIGHT.toString(),
        );
      }
    },
    [primaryTrack, secondaryTracks],
  );

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent, trackId: string) => {
      setTooltip(null);
      if (trackId !== primaryTrack && !secondaryTracks.includes(trackId))
        e.currentTarget.setAttribute("stroke-width", trackHeight.toString());
    },
    [primaryTrack, secondaryTracks],
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
      if (!primaryTrack) {
        setPrimaryTrack(trackId);
        e.currentTarget.setAttribute(
          "stroke-width",
          CLICKED_TRACK_HEIGHT.toString(),
        );
        return;
      }
      if (trackId === primaryTrack) {
        e.currentTarget.setAttribute(
          "stroke-width",
          HOVERED_TRACK_HEIGHT.toString(),
        );
        setPrimaryTrack(secondaryTracks[0]);
        setSecondaryTracks(secondaryTracks.slice(1));
        return;
      }
      if (secondaryTracks.includes(trackId)) {
        e.currentTarget.setAttribute(
          "stroke-width",
          HOVERED_TRACK_HEIGHT.toString(),
        );
        setSecondaryTracks(secondaryTracks.filter((id) => id !== trackId));
        return;
      }
      setSecondaryTracks([...secondaryTracks, trackId]);
      e.currentTarget.setAttribute(
        "stroke-width",
        CLICKED_TRACK_HEIGHT.toString(),
      );
      //onTrackClick?.(trackId);
    },
    [primaryTrack, secondaryTracks],
  );

  return (
    <div
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
            <g key={track.trackId}>
              {track.trackId === primaryTrack && (
                <text
                  x={(endX + startX) / 2}
                  y={track.y - 9}
                  fill="#00d9ffff"
                  textAnchor="middle"
                  fontFamily="monospace"
                  fontSize="0.875rem"
                >
                  Primary
                </text>
              )}
              {secondaryTracks.includes(track.trackId) && (
                <text
                  x={(endX + startX) / 2}
                  y={track.y - 9}
                  fill="#bb37f9ff"
                  textAnchor="middle"
                  fontFamily="monospace"
                  fontSize="0.875rem"
                >
                  Secondary
                </text>
              )}
              {/* Track line */}
              <line
                x1={startX}
                y1={track.y}
                x2={endX}
                y2={track.y}
                stroke={track.color}
                strokeWidth={trackHeight}
                strokeLinecap="round"
                style={{
                  cursor: "pointer",
                  transition: "stroke-width 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  handleMouseEnter(e, track.trackId);
                }}
                onMouseLeave={(e) => handleMouseLeave(e, track.trackId)}
                onClick={(e) => handleMouseClick(e, track.trackId)}
              />

              {/* Start/end markers */}
              <circle
                cx={startX}
                cy={track.y}
                r={3}
                fill={track.color}
                stroke="white"
                strokeWidth={1}
                style={{ pointerEvents: "none" }}
              />
              <circle
                cx={endX}
                cy={track.y}
                r={3}
                fill={track.color}
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
