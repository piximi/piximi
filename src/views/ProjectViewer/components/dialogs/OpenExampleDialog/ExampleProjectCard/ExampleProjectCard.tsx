import React from "react";
import { batch, useDispatch } from "react-redux";

import { BaseHorizCard } from "components/ui/BaseHorizCard";

import { applicationSettingsSlice } from "store/applicationSettings";
import { classifierSlice } from "store/classifier";
import { projectSlice } from "store/project";
import { dataSlice } from "store/data";

import { PseudoFileList, fListToStore } from "utils/file-io/zarr/stores";
import { deserializeProject } from "utils/file-io/deserialize";

import { AlertType } from "utils/enums";
import { ExampleProject } from "data/exampleProjects/exampleProjectsEnum";

import { AlertState } from "utils/types";
import classifierHandler from "utils/models/classification/classifierHandler";
import { useProjectPipeline } from "hooks/useProjectPipeline";
import { FEATURE_FLAGS } from "utils/featureFlags";

// CloudFront distribution domain
const DOMAIN = "https://dw9hr7pc3ofrm.cloudfront.net";
// S3 bucket path
const ROOT_PATH = "exampleProjects";
const EXT = "zip";

type ExampleProjectType = {
  name: string;
  description: string;
  enum: ExampleProject;
  icon: string;
  sources: {
    sourceName: string;
    sourceUrl: string;
  }[];
  license?: {
    licenseName: string;
    licenseUrl: string;
  };
};

type ExampleProjectCardProps = {
  exampleProject: ExampleProjectType;
  onClose: (event?: object, reason?: "backdropClick" | "escapeKeyDown") => void;
};

async function getExamplePath(projectName: ExampleProject): Promise<string> {
  switch (projectName) {
    case ExampleProject.Mnist:
      return import.meta.env.PROD
        ? `${DOMAIN}/${ROOT_PATH}/mnistExampleProject.${EXT}`
        : (await import("data/exampleProjects/mnistExampleProject.zip"))
            .default;

    case ExampleProject.CElegans:
      return import.meta.env.PROD
        ? `${DOMAIN}/${ROOT_PATH}/cElegansExampleProject.${EXT}`
        : (await import("data/exampleProjects/cElegansExampleProject.zip"))
            .default;

    case ExampleProject.HumanU2OSCells:
      return import.meta.env.PROD
        ? `${DOMAIN}/${ROOT_PATH}/HumanU2OSCellsExampleProject.${EXT}`
        : (
            await import(
              "data/exampleProjects/HumanU2OSCellsExampleProject.zip"
            )
          ).default;

    case ExampleProject.BBBC013:
      return import.meta.env.PROD
        ? `${DOMAIN}/${ROOT_PATH}/BBBC013ExampleProject.${EXT}`
        : (await import("data/exampleProjects/BBBC013ExampleProject.zip"))
            .default;

    case ExampleProject.PLP1:
      return import.meta.env.PROD
        ? `${DOMAIN}/${ROOT_PATH}/PLP1ExampleProject.${EXT}`
        : (await import("data/exampleProjects/PLP1ExampleProject.zip")).default;

    case ExampleProject.U2OSPAINTEXP:
      return import.meta.env.PROD
        ? `${DOMAIN}/${ROOT_PATH}/U2OSCellPaintingExampleProject.${EXT}`
        : (
            await import(
              "data/exampleProjects/U2OSCellPaintingExampleProject.zip"
            )
          ).default;

    case ExampleProject.MALARIA:
      return import.meta.env.PROD
        ? `${DOMAIN}/${ROOT_PATH}/MalariaInfectedHumanBloodSmears.${EXT}`
        : (
            await import(
              "data/exampleProjects/MalariaInfectedHumanBloodSmears.zip"
            )
          ).default;

    case ExampleProject.TRANSLOCATION:
      return import.meta.env.PROD
        ? `${DOMAIN}/${ROOT_PATH}/Piximi_Translocation_Tutorial_RGB.${EXT}`
        : (
            await import(
              "data/exampleProjects/Piximi_Translocation_Tutorial_RGB.zip"
            )
          ).default;
  }
}

export const ExampleProjectCard = ({
  exampleProject,
  onClose,
}: ExampleProjectCardProps) => {
  const dispatch = useDispatch();
  const { loadExample } = useProjectPipeline();
  const onLoadProgress = (loadPercent: number, loadMessage: string) => {
    dispatch(
      applicationSettingsSlice.actions.sendLoadPercent({
        loadPercent,
        loadMessage,
      }),
    );
  };

  const openExampleProject = async () => {
    onClose();

    const exampleProjectFilePath = await getExamplePath(exampleProject.enum);
    if (FEATURE_FLAGS.USE_NEW_PIPELINE) {
      await loadExample(exampleProjectFilePath, exampleProject.name);
    } else {
      dispatch(
        applicationSettingsSlice.actions.setLoadPercent({
          loadPercent: -1,
          loadMessage: "loading example project...",
        }),
      );
      const exampleProjectFileList = await fetch(exampleProjectFilePath)
        .then((res) => res.blob())
        .then(
          (blob) =>
            new PseudoFileList([new File([blob], exampleProject.name, blob)]),
        )
        .catch((err: any) => {
          import.meta.env.PROD &&
            import.meta.env.VITE_APP_LOG_LEVEL === "1" &&
            console.error(err);
          throw err;
        });

      const { fileStore, loadedClassifiers } = await fListToStore(
        exampleProjectFileList,
        true,
      );

      try {
        const deserializedProject = await deserializeProject(
          fileStore,
          onLoadProgress,
        );
        if (!deserializedProject) return;

        const { project, data, classifier } = deserializedProject;

        batch(() => {
          // loadPercent will be set to 1 here
          dispatch(projectSlice.actions.resetProject());
          dispatch(projectSlice.actions.setProject({ project }));
          classifierHandler.addModels(loadedClassifiers);
          dispatch(dataSlice.actions.initializeLoadedState(data));
          dispatch(classifierSlice.actions.setDefaults());
          dispatch(
            classifierSlice.actions.setClassifier({
              classifier,
            }),
          );
        });
      } catch (err) {
        const error: Error = err as Error;

        import.meta.env.NODE_ENV !== "production" &&
          import.meta.env.VITE_APP_LOG_LEVEL === "1" &&
          console.error(err);

        const warning: AlertState = {
          alertType: AlertType.Warning,
          name: "Could not parse project file",
          description: `Error while parsing the project file: ${error.name}\n${error.message}`,
        };

        dispatch(
          applicationSettingsSlice.actions.updateAlertState({
            alertState: warning,
          }),
        );
      }

      dispatch(
        applicationSettingsSlice.actions.setLoadPercent({ loadPercent: 1 }),
      );
    }
  };
  return (
    <BaseHorizCard
      title={exampleProject.name}
      image={exampleProject.icon}
      action={openExampleProject}
      description={exampleProject.description}
      sources={exampleProject.sources}
      license={exampleProject.license}
    />
  );
};
