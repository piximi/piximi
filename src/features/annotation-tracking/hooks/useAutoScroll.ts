import { useEffect, useRef } from "react";
import Konva from "konva";

import { Tracklet } from "store/data/types";

import { getLast } from "utils/arrayUtils";
import { Point } from "utils/types";

const IMAGE_SPACING = 20;

/**
 * Hook to automatically scroll the stage to show the first frame of a newly selected track.
 * Implements smooth scrolling with clamping to valid scroll bounds.
 *
 * @param selectedTracks - Array of selected track IDs
 * @param tracklets - Record of all tracklets
 * @param globalShape - Image dimensions for position calculations
 * @param htmlImages - Loaded images record (used for calculating max scroll)
 * @param stageWidth - Width of the stage viewport
 * @param stageRef - Ref to the Konva stage
 * @param activeMetadata - Active metadata (used for null check)
 * @param setStagePosition - Function to update stage position state
 */
export const useAutoScroll = (
  selectedTracks: string[],
  tracklets: Record<string, Tracklet>,
  globalShape: { width: number; height: number },
  htmlImages: Record<string, { image: HTMLImageElement; pos: Point }>,
  stageWidth: number,
  stageRef: React.RefObject<Konva.Stage> | null,
  activeMetadata: any,
  setStagePosition: (pos: Point) => void,
) => {
  const lastScrolledId = useRef<string | undefined>(undefined);

  // Scroll to show the first frame of the selected track in the middle
  useEffect(() => {
    if (selectedTracks.length === 0 || !activeMetadata || !stageRef?.current)
      return;

    const candidateTrackId = getLast(selectedTracks)!;
    // tracks are pushed, so when a new track is selected it becomes the last in the selected list.
    // since the effect fires when the selectedTracklet list changes, we want to avoid scrolling when tracks are deselected
    if (candidateTrackId === lastScrolledId.current) return;
    lastScrolledId.current = candidateTrackId;

    const tracklet = tracklets[candidateTrackId];
    if (!tracklet || tracklet.start === undefined) return;

    const stage = stageRef.current;
    const { x: currentX, y: currentY } = stage.getPosition();
    const stageScale = stage.scaleX();

    // Calculate the x position of the image at the track's start frame
    const targetImageIndex = tracklet.start;
    const targetX =
      globalShape.width * targetImageIndex +
      IMAGE_SPACING * (targetImageIndex + 1);

    // Center this image in the viewport
    const centerX =
      stageWidth / 2 - (targetX + globalShape.width / 2) * stageScale;

    const maxScrollRight = IMAGE_SPACING / 2;
    const maxScrollLeft =
      -1 *
      ((globalShape.width + IMAGE_SPACING) *
        Object.keys(htmlImages).length *
        stageScale -
        stageWidth +
        IMAGE_SPACING);

    // Clamp the position to valid scroll bounds
    const clampedX = Math.max(maxScrollLeft, Math.min(maxScrollRight, centerX));

    // Maintain a constant scroll speed (1s duration max) t = d/v, v = scaled_W/max_t
    const scaledDuration =
      Math.abs(clampedX - currentX) / Math.abs(maxScrollLeft);

    stage.to({
      x: clampedX,
      y: currentY,
      duration: scaledDuration,
      onFinish: () => {
        setStagePosition({ x: clampedX, y: currentY });
      },
    });
  }, [
    selectedTracks,
    tracklets,
    globalShape,
    htmlImages,
    stageWidth,
    stageRef,
    activeMetadata,
    setStagePosition,
  ]);

  // Reset scroll tracking when all tracks are deselected
  useEffect(() => {
    if (selectedTracks.length === 0) lastScrolledId.current = undefined;
  }, [selectedTracks]);
};
