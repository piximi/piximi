import {ListItem, ListItemIcon, ListItemText} from "@material-ui/core";
import * as React from "react";
import BarChartIcon from "@material-ui/icons/BarChart";
import {useTranslation} from "react-i18next";
import {useDialog} from "@piximi/hooks";
import {ConnectedEvaluateClassifierDialog} from "@piximi/evaluate-classifier-dialog";

type EvaluateListItemProps = {
  datasetInitialized: boolean;
  setDatasetInitialized: (datasetInitialized: boolean) => void;
};

export const EvaluateListItem = (props: EvaluateListItemProps) => {
  const {datasetInitialized, setDatasetInitialized} = props;

  const {openedDialog, openDialog, closeDialog} = useDialog();

  const {t: translation} = useTranslation();

  const evaluate = async () => {
    openDialog();
  };

  return (
    <React.Fragment>
      <ListItem button dense disabled onClick={evaluate}>
        <ListItemIcon>
          <BarChartIcon />
        </ListItemIcon>

        <ListItemText primary={translation("Evaluate")} />
      </ListItem>

      <ConnectedEvaluateClassifierDialog />
    </React.Fragment>
  );
};
