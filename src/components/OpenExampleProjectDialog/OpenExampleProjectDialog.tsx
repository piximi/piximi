import { styles } from "./OpenExampleProjectDialog.css";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { makeStyles } from "@mui/styles";
import { useTranslation } from "react-i18next";
import { MenuList } from "@mui/material";
import { OpenExampleProjectMenuItem } from "../OpenExampleProjectMenuItem";
import { ExampleProject } from "data/exampleProjects/exampleProjectsEnum";

import mnistExampleProjectIcon from "data/exampleProjects/mnistExampleProjectIcon.png";
import cElegansExampleProjectIcon from "data/exampleProjects/cElegansExampleProjectIcon.png";
import humanU2OSCellsExampleProjectIcon from "data/exampleProjects/humanU2OSCellsExampleProjectIcon.png";

const useStyles = makeStyles(styles);

type OpenExampleClassifierDialogProps = {
  open: boolean;
  onClose: () => void;
  popupState: any;
};

export const OpenExampleClassifierDialog = (
  props: OpenExampleClassifierDialogProps
) => {
  const classes = useStyles({});

  const { t: translation } = useTranslation();
  const { open, onClose, popupState } = props;

  const closeMenueAndDialog = () => {
    onClose();
  };

  return (
    // @ts-ignore
    <Dialog fullWidth maxWidth="sm" open={open}>
      <DialogTitle className={classes.dialogTitle}>
        <Typography variant="h6">
          {translation("Open example project")}
        </Typography>
        <IconButton
          aria-label="Close"
          className={classes.closeButton}
          onClick={closeMenueAndDialog}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent classes={{ root: classes.dialogContent }}>
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
