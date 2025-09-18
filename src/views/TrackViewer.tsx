"use client";

import { useMemo, useState } from "react";
import { Tracklet } from "store/data/types";
import { RequireField } from "utils/types";

interface TrackVisualizerProps {
  tracks: Tracklet[];
  numFrames: number;
  width?: number;
  height?: number;
  trackHeight?: number;
  trackSpacing?: number;
  onTrackClick?: (id: string) => void;
}

type ValidTracklet = RequireField<Tracklet, "start" | "end">;

interface PositionedTrack extends ValidTracklet {
  y: number;
  level: number;
}

export function TrackVisualizer({
  tracks,
  numFrames,
  width = 800,
  height = 400,
  trackHeight = 4,
  trackSpacing = 30,
  onTrackClick,
}: TrackVisualizerProps) {
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    trackId: string;
  } | null>(null);
  const validTracks = useMemo(
    () =>
      tracks.filter(
        (track) => track.start !== undefined && track.end !== undefined,
      ) as ValidTracklet[],
    [tracks],
  );
  const { positionedTracks, connections, scale, padding } = useMemo(() => {
    // Build parent-child relationships
    const trackMap = new Map<string, ValidTracklet>();
    validTracks.forEach((track) => {
      trackMap.set(track.trackId, track);
      // Add children references
      if (track.parents) {
        track.parents.forEach((parentId) => {
          const parent = trackMap.get(parentId);
          if (parent) {
            if (!parent.children) parent.children = [];
            if (!parent.children.includes(track.trackId)) {
              parent.children.push(track.trackId);
            }
          }
        });
      }
    });

    // Find connected components (groups of related tracks)
    const visited = new Set<string>();
    const components: string[][] = [];

    function dfs(trackId: string, component: string[]) {
      if (visited.has(trackId)) return;
      visited.add(trackId);
      component.push(trackId);

      const track = trackMap.get(trackId);
      if (track) {
        // Visit parents
        track.parents?.forEach((parentId) => {
          if (!visited.has(parentId)) {
            dfs(parentId, component);
          }
        });
        // Visit children
        track.children?.forEach((childId) => {
          if (!visited.has(childId)) {
            dfs(childId, component);
          }
        });
      }
    }

    // Find all connected components
    validTracks.forEach((track) => {
      if (!visited.has(track.trackId)) {
        const component: string[] = [];
        dfs(track.trackId, component);
        components.push(component);
      }
    });

    // Calculate scale based on the range of start/end values

    const padding = 40;
    const scale = (width - 2 * padding) / numFrames;

    const positioned: PositionedTrack[] = [];
    const positionedMap = new Map<string, PositionedTrack>();
    let currentY = trackSpacing;

    // Sort components by their earliest start time
    components.sort((a, b) => {
      const aMinStart = Math.min(...a.map((id) => trackMap.get(id)!.start));
      const bMinStart = Math.min(...b.map((id) => trackMap.get(id)!.start));
      return aMinStart - bMinStart;
    });

    // Helper function to position a track and its children symmetrically
    function positionTrackWithChildren(
      trackId: string,
      baseY: number,
      componentIndex: number,
    ): number {
      const track = trackMap.get(trackId)!;
      const children = track.children || [];

      if (children.length === 0) {
        // No children, just position the track
        const positionedTrack = {
          ...track,
          y: baseY,
          level: componentIndex,
        };
        positioned.push(positionedTrack);
        positionedMap.set(trackId, positionedTrack);
        return baseY + trackSpacing;
      }

      // Calculate positions for symmetrical arrangement
      const totalHeight = children.length * trackSpacing;
      const isOdd = children.length % 2 === 1;

      if (isOdd) {
        // Odd number of children: middle child at same level as parent
        const middleIndex = Math.floor(children.length / 2);
        const parentY = baseY + middleIndex * trackSpacing;

        // Position parent
        const positionedTrack = {
          ...track,
          y: parentY,
          level: componentIndex,
        };
        positioned.push(positionedTrack);
        positionedMap.set(trackId, positionedTrack);

        // Position children symmetrically
        children.forEach((childId, index) => {
          const childY = baseY + index * trackSpacing;
          const childTrack = trackMap.get(childId)!;
          const positionedChild = {
            ...childTrack,
            y: childY,
            level: componentIndex,
          };
          positioned.push(positionedChild);
          positionedMap.set(childId, positionedChild);
        });

        return baseY + totalHeight + trackSpacing;
      } else {
        // Even number of children: parent between middle two children
        const parentY = baseY + (children.length / 2 - 0.5) * trackSpacing;

        // Position parent
        const positionedTrack = {
          ...track,
          y: parentY,
          level: componentIndex,
        };
        positioned.push(positionedTrack);
        positionedMap.set(trackId, positionedTrack);

        // Position children symmetrically
        children.forEach((childId, index) => {
          const childY = baseY + index * trackSpacing;
          const childTrack = trackMap.get(childId)!;
          const positionedChild = {
            ...childTrack,
            y: childY,
            level: componentIndex,
          };
          positioned.push(positionedChild);
          positionedMap.set(childId, positionedChild);
        });

        return baseY + totalHeight + trackSpacing;
      }
    }

    components.forEach((component, componentIndex) => {
      // Find root tracks (tracks with no parents in this component)
      const rootTracks = component.filter((trackId) => {
        const track = trackMap.get(trackId)!;
        return (
          !track.parents ||
          track.parents.length === 0 ||
          !track.parents.some((parentId) => component.includes(parentId))
        );
      });

      // Sort root tracks by start time
      rootTracks.sort((a, b) => {
        const trackA = trackMap.get(a)!;
        const trackB = trackMap.get(b)!;
        return trackA.start - trackB.start;
      });

      // Position each root track and its descendants
      rootTracks.forEach((rootTrackId) => {
        currentY = positionTrackWithChildren(
          rootTrackId,
          currentY,
          componentIndex,
        );
      });

      // Handle any remaining tracks in the component that weren't positioned
      component.forEach((trackId) => {
        if (!positionedMap.has(trackId)) {
          const track = trackMap.get(trackId)!;
          const positionedTrack = {
            ...track,
            y: currentY,
            level: componentIndex,
          };
          positioned.push(positionedTrack);
          positionedMap.set(trackId, positionedTrack);
          currentY += trackSpacing;
        }
      });

      // Add extra spacing between components
      currentY += trackSpacing * 0.5;
    });

    // Generate connections
    const connections: Array<{
      from: { x: number; y: number };
      to: { x: number; y: number };
    }> = [];

    positioned.forEach((track) => {
      if (track.parents) {
        track.parents.forEach((parentId) => {
          const parent = positioned.find((p) => p.trackId === parentId);
          if (parent) {
            connections.push({
              from: {
                x: padding + parent.end * scale,
                y: parent.y,
              },
              to: {
                x: padding + track.start * scale,
                y: track.y,
              },
            });
          }
        });
      }
    });

    return {
      positionedTracks: positioned,
      connections,
      scale,
      padding,
    };
  }, [validTracks, width, height, trackSpacing, numFrames]);

  const svgHeight = Math.max(
    height,
    positionedTracks.length * trackSpacing + 100,
  );
  const handleMouseEnter = (e: React.MouseEvent, trackId: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const svgRect = (
      e.currentTarget.closest("svg") as SVGElement
    ).getBoundingClientRect();
    setTooltip({
      x: e.clientX - svgRect.left,
      y: e.clientY - svgRect.top - 10,
      trackId,
    });
    e.currentTarget.setAttribute("stroke-width", "6");
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    setTooltip(null);
    e.currentTarget.setAttribute("stroke-width", trackHeight.toString());
  };

  const handleMouseMove = (e: React.MouseEvent) => {
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
  };

  return (
    <div style={{ width: "100%", overflow: "auto", position: "relative" }}>
      <svg
        width={width}
        height={svgHeight}
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
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
                onMouseLeave={handleMouseLeave}
                onClick={() => onTrackClick?.(track.trackId)}
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
