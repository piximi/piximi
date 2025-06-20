export enum ClassifierErrorReason {
  NotTrainable,
  NoLabeledImages,
  ExistingPredictions,
  ChannelMismatch,
}
export enum SegmenterErrorReason {
  NotConfigured,
  NoInferenceImages,
  ExistingKind,
}

export type ErrorContext = {
  reason: ClassifierErrorReason | SegmenterErrorReason;
  message: string;
  severity: number;
};
