import { useMemo } from "react";

import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

import { ImageSearch as GestureIcon } from "@mui/icons-material";

import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

import {
  selectKindStates,
  selectSelectedImageIds,
} from "@ProjectViewer/state/selectors";
import { selectAnnotationEntities } from "store/dataV2/selectors";

import { NavChip } from "./NavChip";

export const ImageViewerButton = ({ mobileAlt }: { mobileAlt?: boolean }) => {
  const navigate = useNavigate();
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
        canNavigate ? "Annotate Selection" : "Select Objects to Annotate"
      }
      label="Image Viewer"
      labelIcon={mobileAlt ? <GestureIcon fontSize="small" /> : "Image Viewer"}
      onClick={handleNavigateImageViewer}
      help={HelpItem.NavigateImageViewer}
      disabled={!canNavigate}
    />
  );
};
