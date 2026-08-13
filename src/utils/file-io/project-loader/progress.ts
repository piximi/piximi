export function subProgress(
  onProgress: (p: number) => void,
  stage: { start: number; end: number },
): (p: number) => void {
  return (localP: number) =>
    onProgress(
      stage.start +
        (stage.end - stage.start) * Math.max(0, Math.min(1, localP)),
    );
}
