import { useNavigate } from "react-router-dom";

import { Straighten as StraightenIcon } from "@mui/icons-material";

import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

import { NavChip } from "./NavChip";

export const MeasurementsButton = ({ mobileAlt }: { mobileAlt?: boolean }) => {
  const navigate = useNavigate();
  const handleNavigateMeasurements = () => {
    navigate("/measurements");
  };
  return (
    <NavChip
      tooltip="Go to Measurements"
      label="Measure"
      labelIcon={mobileAlt ? <StraightenIcon fontSize="small" /> : "Measure"}
      onClick={handleNavigateMeasurements}
      help={HelpItem.NavigateMeasurements}
    />
  );
};
