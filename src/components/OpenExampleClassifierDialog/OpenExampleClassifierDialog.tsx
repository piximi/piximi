import { styles } from "./OpenExampleClassifierDialog.css";
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

  const mnistExampleProject = require("../../exampleProjects/mnist.json");
  const cElegansExampleProject = require("../../exampleProjects/C-elegans.json");
  const humanU2OSCellsExampleProject = require("../../exampleProjects/Human-U2OS-cells-transfluor_BBBC016.json");

  const closeMenueAndDialog = () => {
    onClose();
  };

  return (
    // @ts-ignore
    <Dialog fullWidth maxWidth="sm" open={open}>
      <DialogTitle className={classes.dialogTitle}>
        <Typography variant="h6">
          {translation("Open example classifier")}
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
            exampleProject={mnistExampleProject}
            primary={"Open MNIST example project"}
            popupState={popupState}
            onClose={onClose}
          />
          <OpenExampleProjectMenuItem
            exampleProject={cElegansExampleProject}
            primary={"Open C. elegans example project"}
            popupState={popupState}
            onClose={onClose}
          />
          <OpenExampleProjectMenuItem
            exampleProject={humanU2OSCellsExampleProject}
            primary={"Open human U2OS-cells example project"}
            popupState={popupState}
            onClose={onClose}
          />
        </MenuList>
      </DialogContent>
      <DialogActions />
    </Dialog>
  );
};
