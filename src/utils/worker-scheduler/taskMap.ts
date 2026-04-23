import type {
  ImportImageInput,
  LoadAndPrepareOutput,
  StageName,
} from "utils/file-io-v2/file-loader/types";
import type {
  LoadProjectInput,
  LoadProjectOutput,
} from "utils/file-io-v2/project-loader/types";

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
  loadProject: {
    payload: LoadProjectInput;
    result: LoadProjectOutput;
    onProgress?: OnProgressCallback<object>;
    onComplete?: (result?: LoadProjectOutput) => void;
  };
}
