import {
  Box,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  SelectProps,
  Typography,
} from "@mui/material";
import { availableClassificationModels } from "utils/models/availableClassificationModels";

export const ModelPicker = ({
  trainingType,
  setTrainingType,
  archOrName,
  setArchOrName,
}: {
  trainingType: "new" | "existing";
  setTrainingType: React.Dispatch<React.SetStateAction<"new" | "existing">>;
  archOrName: string | number;
  setArchOrName: React.Dispatch<React.SetStateAction<string | number>>;
}) => {
  return (
    <Box py={2}>
      <Typography gutterBottom>
        Train a new model with selected architecture or continue training an
        existing model
      </Typography>
      <FormControl fullWidth>
        <RadioGroup
          row
          value={trainingType}
          onChange={(event) => {
            const type = event.target.value as "new" | "existing";
            setTrainingType(type);
          }}
          sx={{ width: "100%", justifyContent: "space-evenly" }}
        >
          <FormControlLabel
            control={<Radio size="small" />}
            value={"new"}
            label={
              <FormControl
                size="small"
                sx={{ flexDirection: "row", alignItems: "center" }}
                disabled={trainingType !== "new"}
              >
                <FormLabel
                  sx={(theme) => ({
                    fontSize: theme.typography.body2.fontSize,
                    mr: "1rem",
                  })}
                >
                  New Model Architecture:
                </FormLabel>
                <FormGroup>
                  <StyledSelect
                    value={typeof archOrName === "number" ? archOrName : ""}
                    onChange={(event) => {
                      const ind = event.target.value as 0 | 1;
                      setArchOrName(ind);
                    }}
                  >
                    <MenuItem
                      dense
                      value={0}
                      sx={{
                        borderRadius: 0,
                        minHeight: "1rem",
                      }}
                    >
                      Simple CNN
                    </MenuItem>
                    <MenuItem
                      dense
                      value={1}
                      sx={{ borderRadius: 0, minHeight: "1rem" }}
                    >
                      MobileNet
                    </MenuItem>
                  </StyledSelect>
                </FormGroup>
              </FormControl>
            }
          />
          <FormControlLabel
            control={<Radio size="small" />}
            value={"existing"}
            disabled={Object.keys(availableClassificationModels).length === 0}
            label={
              <FormControl
                size="small"
                sx={{ flexDirection: "row", alignItems: "center" }}
                disabled={trainingType !== "existing"}
              >
                <FormLabel
                  sx={(theme) => ({
                    fontSize: theme.typography.body2.fontSize,
                    mr: "1rem",
                  })}
                >
                  Pre-Trained Model:
                </FormLabel>
                <FormGroup>
                  <StyledSelect
                    value={typeof archOrName === "string" ? archOrName : ""}
                    onChange={(event) => {
                      const name = event.target.value as string;
                      setArchOrName(name);
                    }}
                  >
                    {Object.keys(availableClassificationModels).map(
                      (modelName, idx) => (
                        <MenuItem
                          key={modelName + idx}
                          dense
                          value={modelName}
                          sx={{
                            borderRadius: 0,
                            minHeight: "1rem",
                          }}
                        >
                          {modelName}
                        </MenuItem>
                      ),
                    )}
                  </StyledSelect>
                </FormGroup>
              </FormControl>
            }
          />
        </RadioGroup>
      </FormControl>
    </Box>
  );
};

const StyledSelect = (props: SelectProps) => {
  return (
    <Select
      {...props}
      MenuProps={{
        sx: {
          py: 0,
          "& .MuiList-root-MuiMenu-list": { py: 0 },
          "& ul": {
            py: 0,
          },
        },
        slotProps: {
          list: {
            sx: {
              py: 0,
              backgroundColor: "red",
              display: "none",
            },
          },
          paper: {
            sx: {
              borderRadius: "0 0 4px 4px",
            },
          },
        },
      }}
      sx={(theme) => ({
        fontSize: theme.typography.body2.fontSize,
        minHeight: "1rem",
      })}
    >
      {props.children}
    </Select>
  );
};
