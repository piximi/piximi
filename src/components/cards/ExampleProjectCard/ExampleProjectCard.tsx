import React from "react";
import { batch, useDispatch } from "react-redux";
import { applicationSettingsSlice } from "store/applicationSettings";
import { classifierSlice } from "store/classifier";
import { projectSlice } from "store/project";
import { PseudoFileList, fListToStore } from "utils/file-io/zarrStores";
import { ExampleProject } from "data/exampleProjects/exampleProjectsEnum";
import { BaseHorizCard } from "../BaseHorizCard";
import { dataSlice } from "store/data/dataSlice";
import { deserializeProject } from "utils/file-io/deserialize";
import { AlertState } from "utils/common/types";
import { AlertType } from "utils/common/enums";

type ExampleProjectType = {
  name: string;
  description: string;
  enum: ExampleProject;
  icon: string;
  source: {
    sourceName: string;
    sourceUrl: string;
  };
  license?: {
    licenseName: string;
    licenseUrl: string;
  };
};

type ExampleProjectCardProps = {
  exampleProject: ExampleProjectType;
  onClose: () => void;
};

export const ExampleProjectCard = ({
  exampleProject,
  onClose,
}: ExampleProjectCardProps) => {
  const dispatch = useDispatch();

  const onLoadProgress = (loadPercent: number, loadMessage: string) => {
    dispatch(
      projectSlice.actions.sendLoadPercent({ loadPercent, loadMessage })
    );
  };

  // CloudFront distribution domain
  const domain = "https://dw9hr7pc3ofrm.cloudfront.net";
  // S3 bucket path
  const rootPath = "exampleProjects";
  const ext = "zip";

  const openExampleProject = async () => {
    onClose();

    dispatch(
      projectSlice.actions.setLoadPercent({
        loadPercent: -1,
        loadMessage: "loading example project...",
      })
    );

    var exampleProjectFilePath: string;
    switch (exampleProject.enum) {
      case ExampleProject.Mnist:
        exampleProjectFilePath =
          process.env.NODE_ENV === "production"
            ? `${domain}/${rootPath}/mnistExampleProject.${ext}`
            : (await import("data/exampleProjects/mnistExampleProject.zip"))
                .default;
        break;
      case ExampleProject.CElegans:
        exampleProjectFilePath =
          process.env.NODE_ENV === "production"
            ? `${domain}/${rootPath}/cElegansExampleProject.${ext}`
            : (await import("data/exampleProjects/cElegansExampleProject.zip"))
                .default;
        break;
      case ExampleProject.HumanU2OSCells:
        exampleProjectFilePath =
          process.env.NODE_ENV === "production"
            ? `${domain}/${rootPath}/HumanU2OSCellsExampleProject.${ext}`
            : (
                await import(
                  "data/exampleProjects/HumanU2OSCellsExampleProject.zip"
                )
              ).default;
        break;
      case ExampleProject.BBBC013:
        exampleProjectFilePath =
          process.env.NODE_ENV === "production"
            ? `${domain}/${rootPath}/BBBC013ExampleProject.${ext}`
            : (await import("data/exampleProjects/BBBC013ExampleProject.zip"))
                .default;
        break;
      case ExampleProject.PLP1:
        exampleProjectFilePath =
          process.env.NODE_ENV === "production"
            ? `${domain}/${rootPath}/PLP1ExampleProject.${ext}`
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
          new PseudoFileList([new File([blob], exampleProject.name, blob)])
      )
      .catch((err: any) => {
        process.env.NODE_ENV === "production" &&
          process.env.REACT_APP_LOG_LEVEL === "1" &&
          console.error(err);
        throw err;
      });

    const fileStore = await fListToStore(exampleProjectFileList, true);

    try {
      const deserializedProject = await deserializeProject(
        fileStore,
        onLoadProgress
      );
      if (!deserializedProject) return;

      const { project, data, classifier } = deserializedProject;

      batch(() => {
        // loadPercent will be set to 1 here

        dispatch(dataSlice.actions.initializeState({ data }));
        dispatch(projectSlice.actions.setProject({ project }));
        dispatch(classifierSlice.actions.setDefaults({}));
        dispatch(
          classifierSlice.actions.setClassifier({
            classifier,
          })
        );
      });
    } catch (err) {
      const error: Error = err as Error;

      process.env.NODE_ENV !== "production" &&
        process.env.REACT_APP_LOG_LEVEL === "1" &&
        console.error(err);

      const warning: AlertState = {
        alertType: AlertType.Warning,
        name: "Could not parse project file",
        description: `Error while parsing the project file: ${error.name}\n${error.message}`,
      };

      dispatch(
        applicationSettingsSlice.actions.updateAlertState({
          alertState: warning,
        })
      );
    }

    dispatch(projectSlice.actions.setLoadPercent({ loadPercent: 1 }));
  };
  return (
    <BaseHorizCard
      title={exampleProject.name}
      image={exampleProject.icon}
      action={openExampleProject}
      description={exampleProject.description}
      source={exampleProject.source}
      license={exampleProject.license}
    />
  );
};
