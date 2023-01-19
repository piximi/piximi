import { ExampleProject } from "data/exampleProjects/exampleProjectsEnum";

export const _importExampleProject = async (
  exampleProjectEnum: ExampleProject
) => {
  var exampleProjectJson: any;
  switch (exampleProjectEnum) {
    case ExampleProject.Mnist:
      exampleProjectJson = await import(
        "data/exampleProjects/mnistExampleProject.json"
      );
      break;
    case ExampleProject.CElegans:
      exampleProjectJson = await import(
        "data/exampleProjects/cElegansExampleProject.json"
      );
      break;
    case ExampleProject.HumanU2OSCells:
      exampleProjectJson = await import(
        "data/exampleProjects/humanU2OSCellsExampleProject.json"
      );
      break;
    case ExampleProject.BBBC013:
      exampleProjectJson = await import(
        "data/exampleProjects/BBBC013ExampleProject.json"
      );
      break;
    case ExampleProject.PLP1:
      exampleProjectJson = await import(
        "data/exampleProjects/PLP1ExampleProject.json"
      );
      break;
    default:
      return;
  }
  return exampleProjectJson;
};
