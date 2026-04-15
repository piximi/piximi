import {
  ImportImageInput,
  LoadAndPrepareOutput,
  StageName,
} from "utils/file-io-v2/types";

type OnProgressCallback<TExtra = object> = (
  args: { value: number } & TExtra,
) => void;
export interface TaskMap {
  loadImage: {
    payload: ImportImageInput;
    result: LoadAndPrepareOutput;
    onProgress?: OnProgressCallback<{ stage: StageName }>;
    onComplete?: (result?: LoadAndPrepareOutput) => void;
  };
}
