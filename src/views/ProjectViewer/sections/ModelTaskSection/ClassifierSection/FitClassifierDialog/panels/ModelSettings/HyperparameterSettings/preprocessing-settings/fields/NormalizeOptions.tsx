import { useMemo, useState } from "react";

import {
  Checkbox,
  FormControl,
  FormControlLabel,
  Tooltip,
} from "@mui/material";

import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

import { useClassifierStatus } from "@ProjectViewer/contexts/ClassifierStatusProvider";

import { isFieldLocked, lockReason } from "../../settingsLock";

import type { NormalizeOptions as NormalizeOptionsType } from "core/dl/types";

export const NormalizeOptions = () => {
  const {
    handleUpdatePreprocessSettings,
    modelIsTrained,
    modelParams,
    classifierStatus,
  } = useClassifierStatus();

  const isTraining = classifierStatus === "training";
  const normalizeOptions = useMemo(() => {
    return modelParams.preprocessSettings.normalizeOptions;
  }, [modelParams]);
  const [rescalable, setRescalable] = useState<boolean>(
    normalizeOptions.normalize,
  );

  const updateNormalizeOptions = (normalizeOptions: NormalizeOptionsType) => {
    handleUpdatePreprocessSettings({ normalizeOptions });
  };
  const onCheckboxChange = () => {
    setRescalable(!rescalable);
    updateNormalizeOptions({
      ...normalizeOptions,
      normalize: !normalizeOptions.normalize,
    });
  };
  return (
    <Tooltip
      title={lockReason("normalizeOptions", isTraining)}
      disableHoverListener={
        !isFieldLocked("normalizeOptions", isTraining, modelIsTrained)
      }
    >
      <FormControl size="small">
        <FormControlLabel
          data-help={HelpItem.PixelIntensityRescale}
          sx={(theme) => ({
            fontSize: theme.typography.body2.fontSize,
            width: "max-content",
            ml: 0,
          })}
          control={
            <Checkbox
              checked={rescalable}
              onChange={onCheckboxChange}
              name="rescale"
              color="primary"
              size="small"
            />
          }
          label="Rescale pixel intensities:"
          labelPlacement="start"
          disableTypography
          disabled={isFieldLocked(
            "normalizeOptions",
            isTraining,
            modelIsTrained,
          )}
        />
      </FormControl>
    </Tooltip>
  );
};
