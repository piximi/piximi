import { useMemo } from "react";

import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

import { ImageSearch as GestureIcon } from "@mui/icons-material";

import { useCapability } from "core/backend";

import { selectAnnotationEntities } from "store/data/selectors";
import { HelpItem } from "help/HelpContent";

import {
  selectKindStates,
  selectSelectedImageIds,
} from "@ProjectViewer/state/selectors";

import { NavChip } from "./NavChip";

export const ImageViewerButton = ({ mobileAlt }: { mobileAlt?: boolean }) => {
  const navigate = useNavigate();
  // The viewer composites raw pixels itself; without them it has nothing
  // to show until it can work from backend composites.
  const available = useCapability("raw-local");
  const initialSelectedImageIds = useSelector(selectSelectedImageIds);
  const allAnnotations = useSelector(selectAnnotationEntities);
  const kindStates = useSelector(selectKindStates);

  const selectedItems = useMemo(() => {
    const selectedAnnotationIds = Object.values(kindStates).flatMap(
      (ks) => ks.selectedIds,
    );
    const annotatedImageIds = selectedAnnotationIds.map(
      (id) => allAnnotations[id].imageId,
    );
    const allImageIds = [
      ...new Set([...initialSelectedImageIds, ...annotatedImageIds]),
    ];
    return { imageIds: allImageIds, annotationIds: selectedAnnotationIds };
  }, [initialSelectedImageIds, kindStates, allAnnotations]);

  const canNavigate = useMemo(
    () =>
      selectedItems.imageIds.length > 0 ||
      selectedItems.annotationIds.length > 0,
    [selectedItems],
  );
  const handleNavigateImageViewer = () => {
    navigate("/imageviewer", {
      state: {
        selectedItems,
      },
    });
  };

  return (
    <NavChip
      tooltip={
        !available
          ? "The Image Viewer is not available with this backend yet"
          : canNavigate
            ? "Annotate Selection"
            : "Select Objects to Annotate"
      }
      label="Image Viewer"
      labelIcon={mobileAlt ? <GestureIcon fontSize="small" /> : "Image Viewer"}
      onClick={handleNavigateImageViewer}
      help={HelpItem.NavigateImageViewer}
      disabled={!canNavigate || !available}
    />
  );
};
