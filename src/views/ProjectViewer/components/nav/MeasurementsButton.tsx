import { useNavigate } from "react-router-dom";

import { Straighten as StraightenIcon } from "@mui/icons-material";

import { useCapability } from "core/backend";

import { HelpItem } from "help/HelpContent";

import { NavChip } from "./NavChip";

export const MeasurementsButton = ({ mobileAlt }: { mobileAlt?: boolean }) => {
  const navigate = useNavigate();
  const available = useCapability("measurements");
  const handleNavigateMeasurements = () => {
    navigate("/measurements");
  };
  return (
    <NavChip
      tooltip={
        available
          ? "Go to Measurements"
          : "Measurements are not available with this backend"
      }
      label="Measure"
      labelIcon={mobileAlt ? <StraightenIcon fontSize="small" /> : "Measure"}
      onClick={handleNavigateMeasurements}
      help={HelpItem.NavigateMeasurements}
      disabled={!available}
    />
  );
};
