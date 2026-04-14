export type StageName = "string";
type OnProgressCallback<TExtra = object> = (
  args: { value: number } & TExtra,
) => void;
export interface TaskMap {
  any: {
    payload: "Payload";
    result: "result";
    onProgress?: OnProgressCallback<{ stage: StageName }>;
    onComplete?: (result?: "result") => void;
  };
}
