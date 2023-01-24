import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import { useTranslation } from "hooks";

import { OpenExampleProjectMenuItem } from "../OpenExampleProjectMenuItem";

import { ExampleProject } from "data/exampleProjects/exampleProjectsEnum";
import mnistExampleProjectIcon from "data/exampleProjects/mnistExampleProjectIcon.png";
import cElegansExampleProjectIcon from "data/exampleProjects/cElegansExampleProjectIcon.png";
import humanU2OSCellsExampleProjectIcon from "data/exampleProjects/humanU2OSCellsExampleProjectIcon.png";
import BBBC013ExampleProjectIcon from "data/exampleProjects/BBBC013ExampleProjectIcon.png";
import PLP1ExampleProjectIcon from "data/exampleProjects/PLP1ExampleProjectIcon.png";

const exampleProjects = [
  {
    projectName: "MNIST example project",
    projectDescription:
      "Small subset of the MNIST database of handwritten digits.",
    exampleProjectEnum: ExampleProject.Mnist,
    projectIcon: mnistExampleProjectIcon,
    projectSource: {
      sourceName: "MNIST",
      sourceUrl: "http://yann.lecun.com/exdb/mnist/",
    },
    license: {
      licenseName: "CC-BY-SA-3",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
    },
  },
  {
    projectName: "C. elegans example project",
    projectDescription:
      "C. elegans infection marker: " +
      "Images show transgenic C. elegans expressing the promoter of gene clec-60 fused to GFP.\n" +
      "Channel 1: brightfield; Channel 2: GFP; Channel 3: mCherry",
    exampleProjectEnum: ExampleProject.CElegans,
    projectIcon: cElegansExampleProjectIcon,
    projectSource: {
      sourceName: "BBBC012",
      sourceUrl: "https://bbbc.broadinstitute.org/BBBC012",
    },
  },
  {
    projectName: "Human U2OS-cells example project",
    projectDescription:
      "Human U2OS cells transfluor: " +
      "This image set is of a Transfluor assay where an orphan GPCR is stably integrated into the b-arrestin GFP expressing U2OS cell line. After one hour incubation with a compound the cells were fixed with (formaldehyde).\n" +
      "Channel 1: GFP; Channel 2: DNA",
    exampleProjectEnum: ExampleProject.HumanU2OSCells,
    projectIcon: humanU2OSCellsExampleProjectIcon,
    projectSource: {
      sourceName: "BBBC016",
      sourceUrl: "https://bbbc.broadinstitute.org/BBBC016",
    },
    license: {
      licenseName: "CC-BY-3",
      licenseUrl: "https://creativecommons.org/licenses/by/3.0/",
    },
  },
  {
    projectName: "Human U2OS-cells cytoplasm crops",
    projectDescription:
      "Human U2OS cells cytoplasm-nucleus translocation: " +
      "Images of cytoplasm to nucleus translocation of the Forkhead (FKHR-EGFP) fusion protein in stably transfected human osteosarcoma cells.\n" +
      "Channel 1: FKHR-GFP; Channel 2: DNA",
    exampleProjectEnum: ExampleProject.BBBC013,
    projectIcon: BBBC013ExampleProjectIcon,
    projectSource: {
      sourceName: "BBBC013",
      sourceUrl: "https://bbbc.broadinstitute.org/BBBC013",
    },
    license: {
      licenseName: "CC-BY-3",
      licenseUrl: "https://creativecommons.org/licenses/by/3.0/",
    },
  },
  {
    projectName: "Human PLP1 localization",
    projectDescription:
      "Human HeLa cells expressing the disease-associated variant of PLP1 protein, which localizes differently than the healthy version.\n" +
      "Channel 1: artifacts; Channel 2: tagged protein (PLP1); Channel 3: DNA",
    exampleProjectEnum: ExampleProject.PLP1,
    projectIcon: PLP1ExampleProjectIcon,
    projectSource: {
      sourceName: "Jessica Lacoste, Mikko Taipale lab, University of Toronto",
      sourceUrl: "http://taipalelab.org/?page_id=56",
    },
    license: {
      licenseName: "CC0",
      licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
    },
  },
];

type OpenExampleProjectDialogProps = {
  open: boolean;
  onClose: () => void;
};

export const OpenExampleProjectDialog = (
  props: OpenExampleProjectDialogProps
) => {
  const t = useTranslation();
  const { open, onClose } = props;

  return (
    <Dialog fullWidth maxWidth="md" open={open} onClose={onClose}>
      <DialogTitle
        sx={{
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
          margin: 0,
          padding: (theme) => theme.spacing(2),
        }}
      >
        {t("Open example project")}
        <IconButton
          aria-label="Close"
          sx={(theme) => ({
            color: theme.palette.grey[500],
            position: "absolute",
            right: theme.spacing(1),
            top: theme.spacing(1),
          })}
          onClick={onClose}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent
        sx={{
          borderTop: (theme) => `1px solid ${theme.palette.divider}`,
          margin: 0,
          padding: (theme) => theme.spacing(1),
        }}
      >
        <List component="div" role="list">
          {exampleProjects.map((exampleProject, index) => {
            return (
              <OpenExampleProjectMenuItem
                key={index}
                exampleProject={exampleProject}
                onClose={onClose}
              />
            );
          })}
        </List>
      </DialogContent>
      <DialogActions />
    </Dialog>
  );
};
