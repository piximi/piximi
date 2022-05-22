import Dialog from "@mui/material/Dialog";
import List from "@mui/material/List";
import malaria from "../../../../images/malaria.png";
import cellPainting from "../../../../images/cell-painting.png";
import * as malariaAnnotations from "../../../../images/malaria.json";
import * as cellPaintingAnnotations from "../../../../images/cell-painting.json";
import { SerializedFileType } from "types/SerializedFileType";
import { DialogTitle, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { OpenExampleImageMenuItem } from "./OpenExampleImageMenuItem";

type ExampleImageDialogProps = {
  onClose: () => void;
  open: boolean;
};

export const ExampleImageDialog = ({
  onClose,
  open,
}: ExampleImageDialogProps) => {
  const exampleImages = [
    {
      exampleImageName: "Malaria infected human blood smears",
      exampleImageData: malaria,
      exampleImageDescription:
        "Blood cells infected by P. vivax (malaria) and stained with Giemsa reagent.",
      exampleImageAnnotations:
        malariaAnnotations as unknown as Array<SerializedFileType>,
      projectSource: {
        sourceName: "BBBC041v1",
        sourceUrl: "https://bbbc.broadinstitute.org/BBBC041",
      },
      license: {
        licenseName: "CC-BY-NC-SA-3",
        licenseUrl: "https://creativecommons.org/licenses/by-nc-sa/3.0/",
      },
    },
    {
      exampleImageName: "U2OS cell-painting experiment",
      exampleImageData: cellPainting,
      exampleImageDescription:
        "U2OS cells treated with an RNAi reagent (https://portals.broadinstitute.org/gpp/public/clone/details?cloneId=TRCN0000195467) and stained for a cell-painting experiment.\n" +
        "Channel 1 (red): Actin, Golgi, and Plasma membrane stained via phalloidin and wheat germ agglutinin; " +
        "Channel 1 (blue): DNA stained via Hoechst; Channel 1 (green): mitochondria stained via MitoTracker",
      exampleImageAnnotations:
        cellPaintingAnnotations as unknown as Array<SerializedFileType>,
      projectSource: {
        sourceName: "Boivin2021.06.22.449195",
        sourceUrl:
          "https://www.biorxiv.org/content/10.1101/2021.06.22.449195v1.full.pdf+html",
      },
    },
  ];

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle
        sx={{
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
          margin: 0,
          padding: (theme) => theme.spacing(2),
        }}
      >
        {"Open example Annotation project"}
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

      <List component="div" role="list">
        {exampleImages.map((exampleImageProject, index) => {
          return (
            <OpenExampleImageMenuItem
              exampleImageProject={exampleImageProject}
              onClose={onClose}
            />
          );
        })}
      </List>
    </Dialog>
  );
};
