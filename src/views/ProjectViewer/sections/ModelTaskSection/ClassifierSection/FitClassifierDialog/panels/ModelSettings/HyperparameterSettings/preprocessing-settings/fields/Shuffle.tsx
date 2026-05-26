import React, { useMemo } from "react";

import {
  Tooltip,
  FormControl,
  FormControlLabel,
  Checkbox,
} from "@mui/material";

import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

import { useClassifierStatus } from "@ProjectViewer/contexts/ClassifierStatusProvider";

import { lockReason, isFieldLocked } from "../../settingsLock";

export const Shuffle = () => {
  const {
    handleUpdatePreprocessSettings,
    modelIsTrained,
    modelParams,
    classifierStatus,
  } = useClassifierStatus();
  const isTraining = classifierStatus === "training";
  const shuffleOptions = useMemo(() => {
    return modelParams.preprocessSettings.shuffle;
  }, [modelParams]);
  const toggleShuffleOptions = () => {
    handleUpdatePreprocessSettings({ shuffle: !shuffleOptions });
  };

  return (
    <Tooltip
      title={lockReason("shuffle", isTraining)}
      disableHoverListener={
        !isFieldLocked("shuffle", isTraining, modelIsTrained)
      }
    >
      <FormControl size="small">
        <FormControlLabel
          data-help={HelpItem.DataShuffling}
          sx={(theme) => ({
            fontSize: theme.typography.body2.fontSize,
            width: "max-content",
            ml: 0,
          })}
          control={
            <Checkbox
              checked={shuffleOptions}
              onChange={toggleShuffleOptions}
              color="primary"
              disabled={isFieldLocked("shuffle", isTraining, modelIsTrained)}
            />
          }
          label="Shuffle on Split"
          labelPlacement="start"
          disableTypography
          disabled={isFieldLocked("shuffle", isTraining, modelIsTrained)}
        />
      </FormControl>
    </Tooltip>
  );
};
