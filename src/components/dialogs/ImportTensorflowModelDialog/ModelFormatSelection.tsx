import {
  FormControl,
  FormControlLabel,
  FormLabel,
  MenuItem,
  Radio,
  RadioGroup,
} from "@mui/material";

export const ModelFormatSelection = ({
  isGraph,
  setIsGraph,
}: {
  isGraph: boolean;
  setIsGraph: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const handleModelFormatChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => setIsGraph(event.target.value === "Graph");

  return (
    <MenuItem>
      <FormControl>
        <FormLabel id="model-type-radio-buttons-group-label">
          Model Format
        </FormLabel>
        <RadioGroup
          row
          aria-labelledby="model-type-radio-buttons-group-label"
          name="model-type-radio-buttons-group"
          value={isGraph ? "Graph" : "Layers"}
          onChange={handleModelFormatChange}
        >
          <FormControlLabel
            value="Graph"
            control={<Radio />}
            label="Graph Model"
          />
          <FormControlLabel
            value="Layers"
            control={<Radio />}
            label="Layers Model"
          />
        </RadioGroup>
      </FormControl>
    </MenuItem>
  );
};
