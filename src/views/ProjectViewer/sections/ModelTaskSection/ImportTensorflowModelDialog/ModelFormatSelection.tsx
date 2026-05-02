import {
  FormControl,
  FormControlLabel,
  FormLabel,
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
    event: React.ChangeEvent<HTMLInputElement>,
  ) => setIsGraph(event.target.value === "Graph");

  return (
    <FormControl
      size="small"
      sx={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <FormLabel id="model-type-radio-buttons-group-label">
        Model Format:
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
          control={<Radio size="small" sx={{ py: 0, px: 1 }} />}
          label="Graph Model"
          componentsProps={{ typography: { variant: "body2" } }}
        />
        <FormControlLabel
          value="Layers"
          control={<Radio size="small" sx={{ py: 0, px: 1 }} />}
          label="Layers Model"
          componentsProps={{ typography: { variant: "body2" } }}
        />
      </RadioGroup>
    </FormControl>
  );
};
