import { useDispatch } from "react-redux";

import { BaseHorizCard } from "components/ui/BaseHorizCard";

import { applicationSettingsSlice } from "store/applicationSettings";

import { ExampleProject } from "data/exampleProjects/exampleProjectsEnum";

import { useProjectLoader } from "hooks";

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
  const { loadExample } = useProjectLoader();

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
      case ExampleProject.U2OSPAINTEXP:
        exampleProjectFilePath = import.meta.env.PROD
          ? `${DOMAIN}/${ROOT_PATH}/U2OSCellPaintingExampleProject.${EXT}`
          : (
              await import(
                "data/exampleProjects/U2OSCellPaintingExampleProject.zip"
              )
            ).default;
        break;
      case ExampleProject.MALARIA:
        exampleProjectFilePath = import.meta.env.PROD
          ? `${DOMAIN}/${ROOT_PATH}/MalariaInfectedHumanBloodSmears.${EXT}`
          : (
              await import(
                "data/exampleProjects/MalariaInfectedHumanBloodSmears.zip"
              )
            ).default;
        break;
      case ExampleProject.TRANSLOCATION:
        exampleProjectFilePath = import.meta.env.PROD
          ? `${DOMAIN}/${ROOT_PATH}/Piximi_Translocation_Tutorial_RGB.${EXT}`
          : (
              await import(
                "data/exampleProjects/Piximi_Translocation_Tutorial_RGB.zip"
              )
            ).default;
        break;
      default:
        return;
    }

    await loadExample(exampleProjectFilePath, exampleProject.name);

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
