import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useTranslation } from "../../hooks/useTranslation";
import { MenuList } from "@mui/material";
import { OpenExampleProjectMenuItem } from "../OpenExampleProjectMenuItem";
import { ExampleProject } from "data/exampleProjects/exampleProjectsEnum";

import mnistExampleProjectIcon from "data/exampleProjects/mnistExampleProjectIcon.png";
import cElegansExampleProjectIcon from "data/exampleProjects/cElegansExampleProjectIcon.png";
import humanU2OSCellsExampleProjectIcon from "data/exampleProjects/humanU2OSCellsExampleProjectIcon.png";

type OpenExampleClassifierDialogProps = {
  open: boolean;
  onClose: () => void;
  popupState: any;
};

export const OpenExampleClassifierDialog = (
  props: OpenExampleClassifierDialogProps
) => {
  const t = useTranslation();
  const { open, onClose, popupState } = props;

  const closeMenuAndDialog = () => {
    onClose();
  };

  return (
    <Dialog fullWidth maxWidth="sm" open={open}>
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
          onClick={closeMenuAndDialog}
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
        <MenuList>
          <OpenExampleProjectMenuItem
            exampleProject={ExampleProject.Mnist}
            projectName={"Open MNIST example project"}
            projectIcon={mnistExampleProjectIcon}
            popupState={popupState}
            onClose={onClose}
          />
          <OpenExampleProjectMenuItem
            exampleProject={ExampleProject.CElegans}
            projectName={"Open C. elegans example project"}
            projectIcon={cElegansExampleProjectIcon}
            popupState={popupState}
            onClose={onClose}
          />
          <OpenExampleProjectMenuItem
            exampleProject={ExampleProject.HumanU2OSCells}
            projectName={"Open human U2OS-cells example project"}
            projectIcon={humanU2OSCellsExampleProjectIcon}
            popupState={popupState}
            onClose={onClose}
          />
        </MenuList>
      </DialogContent>
      <DialogActions />
    </Dialog>
  );
};
