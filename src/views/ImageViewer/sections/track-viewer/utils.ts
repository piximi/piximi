import Konva from "konva";
import { KonvaEventObject } from "konva/lib/Node";
import { Point } from "utils/types";
import { PositionedTrack, ValidTracklet } from "./types";
import { difference } from "lodash";

const PADDING = 40;

const COMPONENT_SPACING_MULTIPLIER = 0.5;

export const zoomAndOffset = (
  stage: Konva.Stage,
  newScale: number,
  center: Point,
  maxScrollRight?: number,
  maxScrollLeft?: number,
) => {
  if (!center || !stage) return;

  const stageX = stage.x();
  const stageY = stage.y();
  const stageScale = stage.scaleX();
  const stageWidth = stage.width();

  const mousePointTo = {
    x: (center.x - stageX!) / stageScale,
    y: (center.y - stageY!) / stageScale,
  };

  const newPos = {
    x: center.x - mousePointTo.x * newScale,
    y: center.y - mousePointTo.y * newScale,
  };

  if (maxScrollRight && newPos.x > maxScrollRight) {
    newPos.x = maxScrollRight;
  }

  if (maxScrollLeft) {
    // Recalculate maxScrollLeft for the new scale
    // Original formula: -(totalContentWidth * scale - stageWidth + spacing)
    // We need to scale the content width from old scale to new scale
    const contentWidthAtUnitScale =
      (-1 * maxScrollLeft + stageWidth - 20) / stageScale;
    const newMaxScrollLeft = -(
      contentWidthAtUnitScale * newScale -
      stageWidth +
      20
    );

    if (newPos.x < newMaxScrollLeft) {
      newPos.x = newMaxScrollLeft;
    }
  }

  stage.position(newPos);
  stage.scale({ x: newScale, y: newScale });
};

export const handlePinchZoom = (
  event: KonvaEventObject<WheelEvent>,
  maxScrollRight?: number,
  maxScrollLeft?: number,
) => {
  const stage = event.target.getStage()!;
  const stageWidth = stage.width();
  const contentWidthAtUnitScale = maxScrollLeft! * -1 + stageWidth - 20;

  const { deltaY, ctrlKey } = event.evt;

  const oldScale = stage.scaleX();
  const direction = deltaY > 0 ? -1 : 1;

  // Use different scaling factors for different input types
  let scaleBy = 1.1; // Default for mouse wheel

  // Trackpad gestures often have smaller deltaY values and ctrlKey
  if (ctrlKey || Math.abs(deltaY) < 10) {
    scaleBy = 1.05; // More sensitive for trackpad
  }

  const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

  // if the total content width is less than the width of the stage, dont zoom out further
  if (contentWidthAtUnitScale < stageWidth && newScale < oldScale) {
    console.log("min list width reached");
    return;
  }
  const center = {
    x: stage.getPointerPosition()!.x,
    y: (stage.height() / 2) * stage.scaleX() + stage.y(),
  };

  zoomAndOffset(stage, newScale, center, maxScrollRight, maxScrollLeft);
};

export const getNewWheelPos = (
  event: KonvaEventObject<WheelEvent>,
  maxScrollRight?: number,
  maxScrollLeft?: number,
) => {
  event.evt.preventDefault();
  const stage = event.target.getStage()!;
  const { deltaX, deltaY, ctrlKey, metaKey } = event.evt;
  // Gesture detection
  const isZoomGesture = ctrlKey || metaKey;

  const isHorizontalPan =
    Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 0;
  const isVerticalPan =
    Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 0;
  const isBothAxisPan =
    Math.abs(deltaX) > 0 && Math.abs(deltaY) > 0 && !isZoomGesture;

  if (isZoomGesture) {
    // Zoom logic (same as above)
    handlePinchZoom(event, maxScrollRight, maxScrollLeft);
  } else if (isHorizontalPan || isVerticalPan || isBothAxisPan) {
    // Pan logic
    const currentPos = { x: stage.x(), y: stage.y() };

    // Adjust sensitivity based on zoom level
    const panSensitivity = 1 / stage.scaleX();

    const newX = currentPos.x - deltaX * panSensitivity;

    // Prevents panning past content limits
    if (maxScrollRight && newX > maxScrollRight) return;
    if (maxScrollLeft && newX < maxScrollLeft) return;

    const newPos = {
      x: currentPos.x - deltaX * panSensitivity,
      y: currentPos.y,
    };

    return newPos;
  }
};

/**
 * Generates positioned tracks and their visual connections for the track visualizer.
 * This function processes tracklet relationships and calculates optimal positioning
 * to display hierarchical track structures with parent-child relationships.
 *
 * @param validTracks - Array of tracklets with validated start/end times
 * @param width - Available width for the visualization
 * @param trackSpacing - Vertical spacing between tracks
 * @param numFrames - Total number of frames in the sequence
 * @returns Object containing positioned tracks, connections, scale factor, and padding
 */
export const generateRelationships = (
  validTracks: ValidTracklet[],
  width: number,
  trackSpacing: number,
  numFrames: number,
) => {
  // Create immutable copies and build relationships in O(n) time
  const trackMap = new Map<string, ValidTracklet>();
  const childrenMap = new Map<string, string[]>();

  // First pass: create track map and initialize children arrays
  validTracks.forEach((track) => {
    // Create immutable copy to prevent side effects
    const trackCopy = { ...track };
    trackMap.set(track.trackId, trackCopy);
    childrenMap.set(track.trackId, []);
  });

  // Second pass: build parent-child relationships efficiently
  validTracks.forEach((track) => {
    if (track.parents) {
      track.parents.forEach((parentId) => {
        const parentChildren = childrenMap.get(parentId);
        if (parentChildren && !parentChildren.includes(track.trackId)) {
          parentChildren.push(track.trackId);
        }
      });
    }
  });

  // Third pass: assign children arrays to tracks
  trackMap.forEach((track, trackId) => {
    const children = childrenMap.get(trackId);
    if (children && children.length > 0) {
      track.children = children;
    }
  });

  //console.log(trackMap);
  /**
   * PHASE 2: Find connected components using depth-first search
   * Groups tracks that are related through parent-child relationships into components.
   * This allows for proper spacing between unrelated track families.
   */
  const visited = new Set<string>();
  const components: string[][] = [];

  /**
   * Iterative DFS helper to traverse connected tracks
   * Uses an explicit stack to avoid stack overflow and makes the function pure.
   */
  function dfsIterative(startTrackId: string): string[] {
    const component: string[] = [];
    const stack: string[] = [startTrackId];
    const localVisited = new Set<string>();

    while (stack.length > 0) {
      const trackId = stack.pop()!;

      if (localVisited.has(trackId) || visited.has(trackId)) {
        continue;
      }

      localVisited.add(trackId);
      visited.add(trackId);
      component.push(trackId);

      const track = trackMap.get(trackId);
      if (track) {
        // Add connected parent tracks to stack
        track.parents?.forEach((parentId) => {
          if (!visited.has(parentId) && !localVisited.has(parentId)) {
            stack.push(parentId);
          }
        });
        // Add connected child tracks to stack
        track.children?.forEach((childId) => {
          if (!visited.has(childId) && !localVisited.has(childId)) {
            stack.push(childId);
          }
        });
      }
    }

    return component;
  }

  // Find all connected components using iterative depth-first search
  validTracks.forEach((track) => {
    if (!visited.has(track.trackId)) {
      const component = dfsIterative(track.trackId);
      components.push(component);
    }
  });

  /**
   * PHASE 3: Calculate scale for time-to-pixel conversion
   * Make padding configurable, consider adaptive scaling based on
   * track density and duration distribution.
   */
  const scale = (width - 2 * PADDING) / numFrames;

  // Initialize positioning state
  const positioned: PositionedTrack[] = [];
  const positionedMap = new Map<string, PositionedTrack>();
  let currentY = trackSpacing;

  /**
   * Sort components by earliest start time using efficient min-finding
   * Helper function to find minimum start time without spread operator
   */
  function findMinStartTime(componentIds: string[]): number {
    let minStart = Infinity;
    for (const id of componentIds) {
      const track = trackMap.get(id);
      if (track && track.start < minStart) {
        minStart = track.start;
      }
    }
    return minStart === Infinity ? 0 : minStart;
  }

  components.sort((a, b) => {
    const aMinStart = findMinStartTime(a);
    const bMinStart = findMinStartTime(b);
    return aMinStart - bMinStart;
  });

  /**
   * Recursive positioning that handles deep hierarchies
   * First calculates the total space needed for the entire subtree, then positions tracks
   */
  function calculateSubtreeHeight(
    trackId: string,
    visited: Set<string> = new Set(),
  ): number {
    if (visited.has(trackId)) return 0; // Prevent infinite recursion
    visited.add(trackId);

    const track = trackMap.get(trackId);
    if (!track || !track.children || track.children.length === 0) {
      return trackSpacing; // Leaf node
    }

    // Calculate total height needed for all children subtrees
    let totalChildrenHeight = 0;
    for (const childId of track.children) {
      totalChildrenHeight += calculateSubtreeHeight(childId, visited);
    }
    return Math.max(trackSpacing, totalChildrenHeight);
  }

  function positionTrackWithChildren(
    trackId: string,
    baseY: number,
    componentIndex: number,
    visitedPositioning: Set<string> = new Set(),
  ): number {
    if (visitedPositioning.has(trackId)) {
      return baseY; // Prevent infinite recursion
    }
    visitedPositioning.add(trackId);

    const track = trackMap.get(trackId);
    if (!track) {
      console.warn(`Track with ID ${trackId} not found in trackMap`);
      return baseY + trackSpacing;
    }

    const children = track.children || [];
    const parents = track.parents || [];

    if (children.length === 0) {
      // Leaf node case: position the track directly
      const positionedTrack = {
        ...track,
        y: baseY,
        level: componentIndex,
      };
      positioned.push(positionedTrack);
      positionedMap.set(trackId, positionedTrack);
      return baseY + trackSpacing;
    }

    // Calculate space needed for each child subtree
    const childHeights = children.map((childId) => {
      //console.log("---", childId, "---");
      return calculateSubtreeHeight(childId, new Set());
    });
    //console.log("childHeights: ", childHeights);
    const totalChildrenHeight = childHeights.reduce(
      (sum, height) => sum + height,
      0,
    );

    // Position parent at the center of its children's space
    let parentY;
    if (parents.length > 1) parentY = baseY;
    else parentY = baseY + (totalChildrenHeight - trackSpacing) / 2;
    const positionedTrack = {
      ...track,
      y: parentY,
      level: componentIndex,
    };
    positioned.push(positionedTrack);
    positionedMap.set(trackId, positionedTrack);

    // Recursively position each child subtree
    let currentChildY =
      parents.length > 1 ? baseY - totalChildrenHeight / 4 : baseY;
    children.forEach((childId, index) => {
      const childHeight = childHeights[index];
      const child = trackMap.get(childId)!;
      const parents = child.parents!;
      let childCenterY;

      const missingParents = difference(
        parents,
        positioned.map((track) => track.trackId),
      );
      if (missingParents.length > 0) return;

      if (parents.length === 1) childCenterY = currentChildY;
      else
        childCenterY =
          parents
            .map((id) => positionedMap.get(id)!.y)
            .reduce((sum, y) => sum + y, 0) / child.parents!.length;

      // Recursively position the child and its subtree
      positionTrackWithChildren(
        childId,
        childCenterY,
        componentIndex,
        visitedPositioning,
      );

      currentChildY += childHeight;
    });

    return baseY + totalChildrenHeight;
  }

  /**
   * PHASE 4: Position tracks with symmetric child arrangement
   * Positions a parent track and its immediate children in a visually balanced way.
   */

  /*
   * Helper function to identify root tracks within a component
   * A root track is one that has no parents or whose parents are outside the component
   */
  function findRootTracksInComponent(componentIds: string[]): string[] {
    return componentIds.filter((trackId) => {
      const track = trackMap.get(trackId);
      if (!track) {
        console.warn(
          `Track with ID ${trackId} not found in trackMap during root finding`,
        );
        return false;
      }

      // Track is root if it has no parents
      if (!track.parents || track.parents.length === 0) {
        return true;
      }

      // Track is root if none of its parents are in the current component
      return !track.parents.some((parentId) => componentIds.includes(parentId));
    });
  }

  /**
   * PHASE 5: Process each component and position its tracks
   */
  components.forEach((component, componentIndex) => {
    // Use dedicated function for finding root tracks
    const rootTracks = findRootTracksInComponent(component);

    // Sort root tracks chronologically by start time
    rootTracks.sort((a, b) => {
      const trackA = trackMap.get(a);
      const trackB = trackMap.get(b);
      if (!trackA || !trackB) {
        console.warn(`Missing track data during sorting: ${a} or ${b}`);
        return 0;
      }
      return trackA.start - trackB.start;
    });
    //console.log("------\n");
    // Position each root track and its descendants recursively
    rootTracks.forEach((rootTrackId) => {
      currentY = positionTrackWithChildren(
        rootTrackId,
        currentY,
        componentIndex,
        new Set(), // Fresh visited set for each root track
      );
    });
    //console.log("------\n");

    /**
     * Safety net: handle any tracks that weren't positioned above
     * CRITIQUE: This suggests the algorithm above is incomplete. If tracks need
     * to be handled here, it indicates a flaw in the hierarchy processing.
     * IMPROVEMENT: Fix the root cause rather than having a safety net.
     */
    component.forEach((trackId) => {
      if (!positionedMap.has(trackId)) {
        const track = trackMap.get(trackId);
        if (track) {
          const positionedTrack = {
            ...track,
            y: currentY,
            level: componentIndex,
          };
          positioned.push(positionedTrack);
          positionedMap.set(trackId, positionedTrack);
          currentY += trackSpacing;
        } else {
          console.warn(
            `Track with ID ${trackId} not found in trackMap during safety positioning`,
          );
        }
      }
    });

    // Add visual separation between components
    // IMPROVED: Using named constant instead of magic number
    currentY += trackSpacing * COMPONENT_SPACING_MULTIPLIER;
  });

  /**
   * PHASE 6: Generate visual connections between parent and child tracks
   * Creates line coordinates for drawing connections from parent end to child start.
   *
   * Using positionedMap for O(1) lookups instead of O(n) Array.find()
   * This reduces complexity from O(n³) to O(n²) for connection generation.
   */
  const connections: Array<{
    from: { x: number; y: number };
    to: { x: number; y: number };
  }> = [];
  positioned.forEach((track) => {
    if (track.parents) {
      track.parents.forEach((parentId) => {
        // IMPROVED: O(1) lookup using positionedMap instead of Array.find()
        const parent = positionedMap.get(parentId);
        if (parent) {
          connections.push({
            from: {
              x: PADDING + parent.end * scale,
              y: parent.y,
            },
            to: {
              x: PADDING + track.start * scale,
              y: track.y,
            },
          });
        } else {
          console.warn(
            `Parent track ${parentId} not found in positioned tracks`,
          );
        }
      });
    }
  });

  return {
    positionedTracks: positioned,
    connections,
    scale,
    padding: PADDING,
  };
};
