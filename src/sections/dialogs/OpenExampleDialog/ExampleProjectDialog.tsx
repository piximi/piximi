import { ExampleProject } from "data/exampleProjects/exampleProjectsEnum";
import mnistExampleIcon from "data/exampleProjects/mnistExampleProjectIcon.png";
import cElegansExampleIcon from "data/exampleProjects/cElegansExampleProjectIcon.png";
import humanU2OSCellsExampleIcon from "data/exampleProjects/humanU2OSCellsExampleProjectIcon.png";
import BBBC013ExampleIcon from "data/exampleProjects/BBBC013ExampleProjectIcon.png";
import PLP1ExampleIcon from "data/exampleProjects/PLP1ExampleProjectIcon.png";
import { BaseExampleDialog } from "./BaseExampleDialog";
import { ExampleProjectCard } from "sections/cards";
import { Stack } from "@mui/material";

const exampleProjects = [
  {
    name: "MNIST example project",
    description: "Small subset of the MNIST database of handwritten digits.",
    enum: ExampleProject.Mnist,
    icon: mnistExampleIcon,
    source: {
      sourceName: "MNIST",
      sourceUrl: "http://yann.lecun.com/exdb/mnist/",
    },
    license: {
      licenseName: "CC-BY-SA-3",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
    },
  },
  {
    name: "C. elegans example project",
    description:
      "C. elegans infection marker: " +
      "Images show transgenic C. elegans expressing the promoter of gene clec-60 fused to GFP.\n" +
      "Channel 1: GFP; Channel 2: mCherry",
    enum: ExampleProject.CElegans,
    icon: cElegansExampleIcon,
    source: {
      sourceName: "BBBC012",
      sourceUrl: "https://bbbc.broadinstitute.org/BBBC012",
    },
  },
  {
    name: "Human U2OS-cells example project",
    description:
      "Human U2OS cells transfluor: " +
      "This image set is of a Transfluor assay where an orphan GPCR is stably integrated into the b-arrestin GFP expressing U2OS cell line. After one hour incubation with a compound the cells were fixed with (formaldehyde).\n" +
      "Channel 1: GFP; Channel 2: DNA",
    enum: ExampleProject.HumanU2OSCells,
    icon: humanU2OSCellsExampleIcon,
    source: {
      sourceName: "BBBC016",
      sourceUrl: "https://bbbc.broadinstitute.org/BBBC016",
    },
    license: {
      licenseName: "CC-BY-3",
      licenseUrl: "https://creativecommons.org/licenses/by/3.0/",
    },
  },
  {
    name: "Human U2OS-cells cytoplasm crops",
    description:
      "Human U2OS cells cytoplasm-nucleus translocation: " +
      "Images of cytoplasm to nucleus translocation of the Forkhead (FKHR-EGFP) fusion protein in stably transfected human osteosarcoma cells.\n" +
      "Channel 1: FKHR-GFP; Channel 2: DNA",
    enum: ExampleProject.BBBC013,
    icon: BBBC013ExampleIcon,
    source: {
      sourceName: "BBBC013",
      sourceUrl: "https://bbbc.broadinstitute.org/BBBC013",
    },
    license: {
      licenseName: "CC-BY-3",
      licenseUrl: "https://creativecommons.org/licenses/by/3.0/",
    },
  },
  {
    name: "Human PLP1 localization",
    description:
      "Human HeLa cells expressing the disease-associated variant of PLP1 protein, which localizes differently than the healthy version.\n" +
      "Channel 1: artifacts; Channel 2: tagged protein (PLP1); Channel 3: DNA",
    enum: ExampleProject.PLP1,
    icon: PLP1ExampleIcon,
    source: {
      sourceName: "Jessica Lacoste, Mikko Taipale lab, University of Toronto",
      sourceUrl: "http://taipalelab.org/?page_id=56",
    },
    license: {
      licenseName: "CC0",
      licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
    },
  },
];

type ExampleProjectDialogProps = {
  open: boolean;
  onClose: () => void;
};

export const ExampleProjectDialog = (props: ExampleProjectDialogProps) => {
  const { open, onClose } = props;

  return (
    <BaseExampleDialog
      title="Open Example Project"
      open={open}
      onClose={onClose}
    >
      <Stack>
        {exampleProjects.map((exampleProject, index) => {
          return (
            <ExampleProjectCard
              key={`${exampleProject.name}-${index}`}
              exampleProject={exampleProject}
              onClose={onClose}
            />
          );
        })}
      </Stack>
    </BaseExampleDialog>
  );
};
