import { Stack } from "@mui/material";

import { BaseExampleDialog } from "./BaseExampleDialog";
import { ExampleProjectCard } from "./ExampleProjectCard";

import malaria from "images/malaria.png";
import { ExampleProject } from "data/exampleProjects/exampleProjectsEnum";
import mnistExampleIcon from "data/exampleProjects/mnistExampleProjectIcon.png";
import cElegansExampleIcon from "data/exampleProjects/cElegansExampleProjectIcon.png";
import humanU2OSCellsExampleIcon from "data/exampleProjects/humanU2OSCellsExampleProjectIcon.png";
import BBBC013ExampleIcon from "data/exampleProjects/BBBC013ExampleProjectIcon.png";
import PLP1ExampleIcon from "data/exampleProjects/PLP1ExampleProjectIcon.png";
import U2OSCellPaintingIcon from "data/exampleProjects/U2OSCellPaintingExampleProjectIcon.png";
import TranslocationIcon from "data/exampleProjects/Translocation_icon.png";
import { CustomTabs } from "components/layout";

const exampleImages = [
  {
    name: "Malaria infected human blood smears",
    imageName: "malaria.png",
    icon: malaria,
    description:
      "Blood cells infected by P. vivax (malaria) and stained with Giemsa reagent.",
    enum: ExampleProject.MALARIA,
    sources: [
      {
        sourceName: "BBBC041v1",
        sourceUrl: "https://bbbc.broadinstitute.org/BBBC041",
      },
    ],
    license: {
      licenseName: "CC-BY-NC-SA-3",
      licenseUrl: "https://creativecommons.org/licenses/by-nc-sa/3.0/",
    },
  },
  {
    name: "U2OS cell-painting experiment",
    description:
      "U2OS cells treated with an RNAi reagent and stained.\n" +
      " Channel 1 (red): Actin, Golgi, and Plasma membrane stained via phalloidin and wheat germ agglutinin; " +
      " Channel 2 (blue): DNA stained via Hoechst; Channel 3 (green): mitochondria stained via MitoTracker",
    enum: ExampleProject.U2OSPAINTEXP,
    icon: U2OSCellPaintingIcon,
    sources: [
      {
        sourceName: "Boivin2021.06.22.449195",
        sourceUrl:
          "https://www.biorxiv.org/content/10.1101/2021.06.22.449195v1.full.pdf+html",
      },
      {
        sourceName: "GPP",
        sourceUrl:
          "https://portals.broadinstitute.org/gpp/public/clone/details?cloneId=TRCN0000195467",
      },
    ],
    license: {
      licenseName: "CC-BY-4",
      licenseUrl: "https://creativecommons.org/publicdomain/zero/4.0/",
    },
  },
  {
    name: "Translocation Tutorial",
    description:
      "Imaged fixed U2OS osteosarcoma (bone cancer) cells expressing a FOXO1A-GFP fusion protein and stained DAPI to label the nuclei.\n" +
      "Channel 1: Channel 2: FKHR-GFP; Channel 3: DNA",
    enum: ExampleProject.TRANSLOCATION,
    icon: TranslocationIcon,
    sources: [
      {
        sourceName: "BBBC013",
        sourceUrl: "https://bbbc.broadinstitute.org/BBBC013",
      },
    ],
    license: {
      licenseName: "CC-BY-3",
      licenseUrl: "https://creativecommons.org/licenses/by/3.0/",
    },
  },
];

const exampleProjects = [
  {
    name: "MNIST example project",
    description: "Small subset of the MNIST database of handwritten digits.",
    enum: ExampleProject.Mnist,
    icon: mnistExampleIcon,
    sources: [
      {
        sourceName: "MNIST",
        sourceUrl: "http://yann.lecun.com/exdb/mnist/",
      },
    ],
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
    sources: [
      {
        sourceName: "BBBC012",
        sourceUrl: "https://bbbc.broadinstitute.org/BBBC012",
      },
    ],
  },
  {
    name: "Human U2OS-cells example project",
    description:
      "Human U2OS cells transfluor: " +
      "This image set is of a Transfluor assay where an orphan GPCR is stably integrated into the b-arrestin GFP expressing U2OS cell line. After one hour incubation with a compound the cells were fixed with (formaldehyde).\n" +
      "Channel 1: GFP; Channel 2: DNA",
    enum: ExampleProject.HumanU2OSCells,
    icon: humanU2OSCellsExampleIcon,
    sources: [
      {
        sourceName: "BBBC016",
        sourceUrl: "https://bbbc.broadinstitute.org/BBBC016",
      },
    ],
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
    sources: [
      {
        sourceName: "BBBC013",
        sourceUrl: "https://bbbc.broadinstitute.org/BBBC013",
      },
    ],
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
    sources: [
      {
        sourceName: "Jessica Lacoste, Mikko Taipale lab, University of Toronto",
        sourceUrl: "http://taipalelab.org/?page_id=56",
      },
    ],
    license: {
      licenseName: "CC0",
      licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
    },
  },
];

type ExampleProjectDialogProps = {
  open: boolean;
  onClose: (event?: object, reason?: "backdropClick" | "escapeKeyDown") => void;
};

export const ExampleProjectDialog = (props: ExampleProjectDialogProps) => {
  const { open, onClose } = props;

  return (
    <BaseExampleDialog
      title="Open Example Project"
      open={open}
      onClose={onClose}
    >
      <CustomTabs
        labels={["Images", "Images with Objects"]}
        childClassName="example-project-tabs"
      >
        <Stack sx={{ overflow: "scroll" }}>
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
        <Stack sx={{ overflow: "scroll" }}>
          {exampleImages.map((exampleImage, index) => {
            return (
              <ExampleProjectCard
                key={`${exampleImage.name}-${index}`}
                exampleProject={exampleImage}
                onClose={onClose}
              />
            );
          })}
        </Stack>
      </CustomTabs>
    </BaseExampleDialog>
  );
};
