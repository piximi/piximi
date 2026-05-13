import { useState } from "react";

import { useSelector } from "react-redux";

import { saveAs } from "file-saver";

import { Box, Button } from "@mui/material";

import { useHotkeys } from "hooks";

import { WithLabel } from "components/inputs";

import { selectProjectName } from "@ProjectViewer/state/selectors";
import { useClassifierStatus } from "@ProjectViewer/contexts/ClassifierStatusProvider";

import { HotkeyContext } from "utils/enums";

import { HyperperameterSettings } from "./HyperparameterSettings";
import { ModelPicker } from "./ModelPicker";
import { ModelSettingsTextField } from "../../ModelSettingsTextField";

export const TrainingSettings = () => {
  return (
    <div>
      <ModelPicker />
      <HyperperameterSettings />
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          py: 1,
        }}
      >
        <ExportHyperparametersButton />
        <SeedInput />
      </Box>
    </div>
  );
};

const ExportHyperparametersButton = () => {
  const { modelParams } = useClassifierStatus();

  const projectName = useSelector(selectProjectName);
  const handleExportHyperparameters = () => {
    const data = new Blob([JSON.stringify(modelParams)], {
      type: "application/json;charset=utf-8",
    });

    saveAs(data, `${projectName}-model_hyperparameters.json`);
  };
  return (
    <Button onClick={handleExportHyperparameters}>
      Export Hyperparameters
    </Button>
  );
};

const SeedInput = () => {
  const { userDefinedSeed, setUserDefinedSeed } = useClassifierStatus();
  const [seedDisplay, setSeedDisplay] = useState<string>(
    userDefinedSeed ? String(userDefinedSeed) : "",
  );
  const [showSeedInput, setShowSeedInput] = useState<boolean>(false);

  const handleSeedValueDisplayChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const v = e.target.value;
    const numberRegex = /^\d+$/i;
    if (numberRegex.test(v) || v.length === 0) setSeedDisplay(v);
  };
  const dispatchSeedValue = () => {
    let seedValue: number | undefined;
    if (seedDisplay.length === 0) seedValue = undefined;
    else if (!Number.isNaN(Number(seedDisplay))) seedValue = +seedDisplay;
    else return;
    setUserDefinedSeed(seedValue);
  };
  useHotkeys(
    "ctrl+shift+.",
    () => setShowSeedInput((v) => !v),
    HotkeyContext.ClassifierDialog,
  );
  return (
    <WithLabel
      label="Seed Value:"
      labelProps={{
        variant: "body2",
        sx: { mr: "1rem", whiteSpace: "nowrap" },
      }}
      sx={{ visibility: showSeedInput ? "visible" : "hidden" }}
    >
      <ModelSettingsTextField
        size="small"
        onChange={handleSeedValueDisplayChange}
        value={seedDisplay}
        fullWidth
        onBlur={dispatchSeedValue}
      />
    </WithLabel>
  );
};
