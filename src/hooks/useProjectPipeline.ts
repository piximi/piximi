import { useCallback, useState } from "react";
import { batch, useDispatch } from "react-redux";

import { useDataPipeline } from "contexts/DataPipelineProvider";

import { dataSlice } from "store/data";
import { projectSlice } from "store/project";
import { classifierSlice } from "store/classifier";
import { segmenterSlice } from "store/segmenter";
import { applicationSettingsSlice } from "store/applicationSettings";

import { buildProjectPayload } from "services/dataPipeline/projectSerialization/projectPayloadBuilder";
import { ProjectPipelineResult } from "services/dataPipeline/types";

import { AlertType } from "utils/enums";
import classifierHandler from "utils/models/classification/classifierHandler";

type UseProjectPipelineReturn = {
  openProject: (files: FileList) => Promise<ProjectPipelineResult>;
  loadExample: (
    examplePath: string,
    projectName: string,
  ) => Promise<ProjectPipelineResult>;
  isLoading: boolean;
};

/**
 * Hook that orchestrates project loading via the new pipeline.
 *
 * Calls DataPipelineService for worker-based deserialization,
 * builds Redux payload, and dispatches full state replacement.
 *
 * Mirrors the legacy flow in WelcomeScreen.handleOpenProject():
 *   resetProject → initializeLoadedState → setProject → setClassifier → setSegmenter
 */
export function useProjectPipeline(): UseProjectPipelineReturn {
  const dispatch = useDispatch();
  const pipeline = useDataPipeline();
  const [isLoading, setIsLoading] = useState(false);

  const dispatchProjectResult = useCallback(
    (result: ProjectPipelineResult) => {
      if (!result.success || !result.data) {
        if (result.errors.length > 0) {
          dispatch(
            applicationSettingsSlice.actions.updateAlertState({
              alertState: {
                alertType: AlertType.Error,
                name: "Project Load Error",
                description: result.errors
                  .map((e) => `${e.fileName} -- ${e.error.message}`)
                  .join("\n---\n"),
              },
            }),
          );
        }
        return;
      }
      const { data, project, classifier, segmenter } = buildProjectPayload(
        result.data,
      );

      for (const modelInfo of Object.entries(result.data.modelFiles)) {
        const [modelName, extractedModelFile] = modelInfo;
        classifierHandler.modelFromFiles(
          extractedModelFile.modelJson!,
          [extractedModelFile.modelWeights!],
          false,
          modelName,
        );
      }

      // Batch dispatch -- same sequence as legacy WelsomeScreen path
      batch(() => {
        dispatch(projectSlice.actions.resetProject());
        dispatch(projectSlice.actions.setProject({ project }));
        dispatch(dataSlice.actions.initializeLoadedState(data));
        dispatch(
          classifierSlice.actions.setClassifier({
            classifier: classifier,
          }),
        );
        dispatch(
          segmenterSlice.actions.setSegmenter({
            segmenter: segmenter,
          }),
        );
      });
    },
    [dispatch],
  );

  const openProject = useCallback(
    async (files: FileList): Promise<ProjectPipelineResult> => {
      setIsLoading(true);
      try {
        const result = await pipeline.openProject(Array.from(files));
        dispatchProjectResult(result);
        return result;
      } finally {
        setIsLoading(false);
      }
    },
    [pipeline, dispatchProjectResult],
  );
  const loadExample = useCallback(
    async (
      examplePath: string,
      projectName: string,
    ): Promise<ProjectPipelineResult> => {
      setIsLoading(true);
      try {
        const exampleProjectFileList = await fetch(examplePath)
          .then((res) => res.blob())
          .then((blob) => [new File([blob], projectName, blob)])
          .catch((err: any) => {
            import.meta.env.PROD &&
              import.meta.env.VITE_APP_LOG_LEVEL === "1" &&
              console.error(err);
            throw err;
          });
        const result = await pipeline.openProject(exampleProjectFileList);
        dispatchProjectResult(result);
        return result;
      } finally {
        setIsLoading(false);
      }
    },
    [pipeline, dispatchProjectResult],
  );

  return { openProject, loadExample, isLoading };
}
