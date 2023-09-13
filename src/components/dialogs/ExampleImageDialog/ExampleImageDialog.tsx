import { BaseExampleDialog } from "../BaseExampleDialog";
import { ExampleImageCard } from "components/cards";

import malaria from "images/malaria.png";
import cellPainting from "images/cell-painting.png";
import {
  malariaAnnotations,
  cellPaintingAnnotations,
} from "data/exampleImages";

import { SerializedFileType } from "types";
const exampleImages = [
  {
    name: "Malaria infected human blood smears",
    imageName: "malaria.png",
    imageData: malaria,
    description:
      "Blood cells infected by P. vivax (malaria) and stained with Giemsa reagent.",
    annotationsFile: malariaAnnotations as SerializedFileType,
    source: {
      sourceName: "BBBC041v1",
      sourceUrl: "https://bbbc.broadinstitute.org/BBBC041",
    },
    license: {
      licenseName: "CC-BY-NC-SA-3",
      licenseUrl: "https://creativecommons.org/licenses/by-nc-sa/3.0/",
    },
  },
  {
    name: "U2OS cell-painting experiment",
    imageName: "cell-painting.png",
    imageData: cellPainting,
    description:
      "U2OS cells treated with an RNAi reagent (https://portals.broadinstitute.org/gpp/public/clone/details?cloneId=TRCN0000195467) and stained for a cell-painting experiment.\n" +
      "Channel 1 (red): Actin, Golgi, and Plasma membrane stained via phalloidin and wheat germ agglutinin; " +
      "Channel 1 (blue): DNA stained via Hoechst; Channel 1 (green): mitochondria stained via MitoTracker",
    annotationsFile: cellPaintingAnnotations as SerializedFileType,
    source: {
      sourceName: "Boivin2021.06.22.449195",
      sourceUrl:
        "https://www.biorxiv.org/content/10.1101/2021.06.22.449195v1.full.pdf+html",
    },
  },
];

type ExampleImageDialogProps = {
  onClose: () => void;
  open: boolean;
};

export const ExampleImageDialog = ({
  onClose,
  open,
}: ExampleImageDialogProps) => {
  return (
    <BaseExampleDialog title="Open Example Image" open={open} onClose={onClose}>
      <>
        {exampleImages.map((exampleImage, index) => {
          return (
            <ExampleImageCard
              key={`${exampleImage.name}-${index}`}
              exampleImage={exampleImage}
              onClose={onClose}
            />
          );
        })}
      </>
    </BaseExampleDialog>
  );
};
