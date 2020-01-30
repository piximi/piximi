import {ListItem, ListItemIcon, ListItemText, Paper} from "@material-ui/core";
import * as React from "react";
import ScatterPlotIcon from "@material-ui/icons/ScatterPlot";
import {useTranslation} from "react-i18next";
import {useDialog} from "@piximi/hooks";
import {ConnectedFitClassifierDialog} from "@piximi/fit-classifier-dialog";

type FitListItemProps = {
  datasetInitialized: boolean;
  setDatasetInitialized: (datasetInitialized: boolean) => void;
};

export const FitListItem = (props: FitListItemProps) => {
  const {datasetInitialized, setDatasetInitialized} = props;

  const {openedDialog, openDialog, closeDialog} = useDialog();

  const {t: translation} = useTranslation();

  const fit = async () => {
    openDialog();
  };

  return (
    <React.Fragment>
      <ListItem button dense onClick={fit}>
        <ListItemIcon>
          <ScatterPlotIcon />
        </ListItemIcon>

        <ListItemText primary={translation("Fit")} />
      </ListItem>

      <ConnectedFitClassifierDialog
        closeDialog={closeDialog}
        openedDialog={openedDialog}
      />
    </React.Fragment>
  );
};
