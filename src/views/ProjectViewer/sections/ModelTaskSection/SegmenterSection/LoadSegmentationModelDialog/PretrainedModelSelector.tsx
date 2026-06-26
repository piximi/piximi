import React, { useMemo, useState } from "react";

import {
  Autocomplete,
  Box,
  FormControl,
  FormHelperText,
  Link,
  TextField,
  Typography,
} from "@mui/material";

import { modelInfo } from "utils/dl/segmentation";
import type {
  ModelDisplayInfo,
  ModelName,
  SegmentaionModelDetails,
} from "utils/dl/segmentation/types";

interface ModelOptionType {
  label: ModelName;
  id: number;
}

type ModelDetails = Omit<ModelDisplayInfo, "name" | "displayName"> & {
  name: string;
};

//github.com/twpkevin06222/Gland-Segmentation/tree/main
export const PretrainedModelSelector = ({
  models,
  setModel,
  error,
  errorText,
  initModel = "-1",
}: {
  models: Array<SegmentaionModelDetails>;
  setModel: (model: SegmentaionModelDetails | undefined) => void;
  error?: boolean;
  errorText?: string;
  initModel: string;
}) => {
  const modelSelectOptions: ModelOptionType[] = useMemo(() => {
    return models.map((model, idx) => ({ label: model.name, id: idx }));
  }, [models]);
  const [selectedModel, setSelectedModel] = useState<ModelOptionType | null>(
    modelSelectOptions[+initModel] ?? null,
  );

  const handlePreTrainedModelChange = (
    event: React.SyntheticEvent<Element, Event>,
    newValue: ModelOptionType | null,
  ) => {
    setSelectedModel(newValue ? modelSelectOptions[newValue.id] : null);
    setModel(newValue ? models[newValue.id] : undefined);
  };

  const modelDetails: ModelDetails | undefined = useMemo(() => {
    if (!selectedModel) return undefined;
    const { name, displayName, ...rest } = modelInfo[selectedModel.label];

    return {
      name: displayName,
      ...rest,
    };
  }, [selectedModel]);

  return (
    <React.Fragment>
      <Typography gutterBottom sx={{ pb: 2 }}>
        Choose from a provided pre-trained model:
      </Typography>
      <FormControl sx={{ width: "75%", pb: 2 }} size="small" error={error}>
        <Autocomplete
          id="pre-trained-model-select"
          options={modelSelectOptions}
          value={selectedModel}
          onChange={handlePreTrainedModelChange}
          sx={{ width: 300, mx: "auto" }}
          renderInput={(params) => (
            <TextField {...params} label="Pre-trained Models" />
          )}
          blurOnSelect
          openOnFocus
          size="small"
        />

        <FormHelperText sx={{ mx: "auto" }}>{errorText ?? " "}</FormHelperText>
      </FormControl>
      {modelDetails && <ModelInfo modelDetails={modelDetails} />}
    </React.Fragment>
  );
};

const ModelInfo = ({ modelDetails }: { modelDetails: ModelDetails }) => {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "max-content 1fr",
      }}
    >
      {Object.entries(modelDetails).map(([key, value]) => (
        <React.Fragment key={key}>
          <Typography
            variant="caption"
            color={key === "cloudWarning" ? "warning" : "textSecondary"}
            sx={(theme) =>
              key === "cloudWarning"
                ? {
                    borderBlock: `1px solid ${theme.palette.Alert.warningIconColor}`,
                    mt: 1,
                  }
                : {}
            }
          >
            {key === "cloudWarning"
              ? "Cloud Warning"
              : key[0].toUpperCase() + key.slice(1)}
            :
          </Typography>
          {Array.isArray(value) ? (
            <Typography
              variant="caption"
              color="textSecondary"
              key={key + "-value"}
              sx={{ pl: 1 }}
            >
              {value.map((src, index) => (
                <React.Fragment key={src.text}>
                  <Link
                    className="source_link"
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {src.text}
                  </Link>
                  {index < value.length - 1 && <span>, </span>}
                </React.Fragment>
              ))}
            </Typography>
          ) : (
            <Typography
              variant="caption"
              color="textSecondary"
              sx={(theme) =>
                key === "cloudWarning"
                  ? {
                      //bgcolor: theme.palette.Alert.warningStandardBg,
                      borderBlock: `1px solid ${theme.palette.Alert.warningIconColor}`,
                      mt: 1,
                      pl: 1,
                    }
                  : { pl: 1 }
              }
            >
              {typeof value === "string" ? (
                value
              ) : value.url ? (
                <Link
                  className="source_link"
                  href={value.url!}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {value.name}
                </Link>
              ) : (
                value.name
              )}
            </Typography>
          )}
        </React.Fragment>
      ))}
    </Box>
  );
};
