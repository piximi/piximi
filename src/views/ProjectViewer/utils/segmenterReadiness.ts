import type { ChannelPolicy } from "core/dl/segmentation/types";

export enum ErrorReason {
  NotConfigured,
  NoInferenceImages,
  ExistingKind,
  ChannelMismatch,
}

export type ErrorContext = {
  reason: ErrorReason;
  message: string;
  severity: number;
};

export type SegmenterPrecheckInput = {
  policy: ChannelPolicy | undefined;
  channelIds: string[];
  imageCount: number;
};

/* Individual gates. Success -> true. */
export const segmenterPrecheck = ({
  policy,
  channelIds,
  imageCount,
}: SegmenterPrecheckInput) => ({
  images: imageCount > 0,
  channels:
    !policy ||
    (channelIds.length > 0 &&
      channelIds.every((id) => id !== "") &&
      (policy.mode !== "fixed" || channelIds.length === policy.count)),
});

/*
 * The single blocking error, or undefined when inference may run. Lowest
 * severity wins: a missing image is reported ahead of a channel mismatch
 * because choosing channels cannot resolve it.
 */
export const segmenterError = (
  input: SegmenterPrecheckInput,
): ErrorContext | undefined => {
  const precheck = segmenterPrecheck(input);
  const errors: ErrorContext[] = [];

  if (!precheck.images) {
    errors.push({
      reason: ErrorReason.NoInferenceImages,
      message: "No images available for inference",
      severity: 1,
    });
  }
  if (!precheck.channels) {
    errors.push({
      reason: ErrorReason.ChannelMismatch,
      message: "Select channels for segmentation",
      severity: 2,
    });
  }

  return errors.length === 0
    ? undefined
    : errors.reduce((prev, curr) =>
        curr.severity < prev.severity ? curr : prev,
      );
};
