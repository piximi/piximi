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

export const ExampleProjectCard = ({
  exampleProject,
  onClose,
}: ExampleProjectCardProps) => {
  const dispatch = useDispatch();

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

    dispatch(
      applicationSettingsSlice.actions.setLoadPercent({
        loadPercent: -1,
        loadMessage: "loading example project...",
      }),
    );

    let exampleProjectFilePath: string;
    switch (exampleProject.enum) {
      case ExampleProject.Mnist:
        exampleProjectFilePath = import.meta.env.PROD
          ? `${DOMAIN}/${ROOT_PATH}/mnistExampleProject.${EXT}`
          : (await import("data/exampleProjects/mnistExampleProject.zip"))
              .default;
        break;
      case ExampleProject.CElegans:
        exampleProjectFilePath = import.meta.env.PROD
          ? `${DOMAIN}/${ROOT_PATH}/cElegansExampleProject.${EXT}`
          : (await import("data/exampleProjects/cElegansExampleProject.zip"))
              .default;
        break;
      case ExampleProject.HumanU2OSCells:
        exampleProjectFilePath = import.meta.env.PROD
          ? `${DOMAIN}/${ROOT_PATH}/HumanU2OSCellsExampleProject.${EXT}`
          : (
              await import(
                "data/exampleProjects/HumanU2OSCellsExampleProject.zip"
              )
            ).default;
        break;
      case ExampleProject.BBBC013:
        exampleProjectFilePath = import.meta.env.PROD
          ? `${DOMAIN}/${ROOT_PATH}/BBBC013ExampleProject.${EXT}`
          : (await import("data/exampleProjects/BBBC013ExampleProject.zip"))
              .default;
        break;
      case ExampleProject.PLP1:
        exampleProjectFilePath = import.meta.env.PROD
          ? `${DOMAIN}/${ROOT_PATH}/PLP1ExampleProject.${EXT}`
          : (await import("data/exampleProjects/PLP1ExampleProject.zip"))
              .default;
        break;
      default:
        return;
    }

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
        classifierHandler.addModels(loadedClassifiers);
        dispatch(dataSlice.actions.initializeState({ data }));
        dispatch(classifierSlice.actions.setDefaults());
        dispatch(
          classifierSlice.actions.setClassifier({
            classifier,
          }),
        );
        dispatch(projectSlice.actions.setProject({ project }));
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
