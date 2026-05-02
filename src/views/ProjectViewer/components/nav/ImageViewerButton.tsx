import { useNavigate } from "react-router-dom";

import { ImageSearch as GestureIcon } from "@mui/icons-material";

import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

import { NavChip } from "./NavChip";

export const ImageViewerButton = ({
  selectedThings,
  mobileAlt,
}: {
  selectedThings: string[];
  mobileAlt?: boolean;
}) => {
  const navigate = useNavigate();
  const handleNavigateImageViewer = () => {
    navigate("/imageviewer", {
      state: {
        initialThingIds: selectedThings,
      },
    });
  };
  return (
    <NavChip
      tooltip={
        selectedThings.length === 0
          ? "Select Objects to Annotate"
          : "Annotate Selection"
      }
      label="Image Viewer"
      labelIcon={mobileAlt ? <GestureIcon fontSize="small" /> : "Image Viewer"}
      onClick={handleNavigateImageViewer}
      help={HelpItem.NavigateImageViewer}
    />
  );
};
