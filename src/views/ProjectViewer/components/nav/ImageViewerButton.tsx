import { useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

import { ImageSearch as GestureIcon } from "@mui/icons-material";

import { useBackend, useCapability } from "core/backend";

import { selectAnnotationEntities } from "store/data/selectors";
import { HelpItem } from "help/HelpContent";

import {
  selectKindStates,
  selectSelectedImageIds,
} from "@ProjectViewer/state/selectors";

import { NavChip } from "./NavChip";

import type { Backend } from "core/backend";

const ID_PAGE = 1000;

/* The images some annotations belong to, asked of the backend for the ids
 * the store does not hold (a remote project's annotations are not
 * mirrored). */
const imagesOfAnnotations = async (
  backend: Backend,
  ids: string[],
): Promise<string[]> => {
  const imageIds: string[] = [];
  for (let start = 0; start < ids.length; start += ID_PAGE) {
    const page = await backend.query.annotations(
      { ids: ids.slice(start, start + ID_PAGE) },
      { limit: ID_PAGE },
    );
    imageIds.push(...page.items.map((record) => record.annotation.imageId));
  }
  return imageIds;
};

export const ImageViewerButton = ({ mobileAlt }: { mobileAlt?: boolean }) => {
  const navigate = useNavigate();
  const backend = useBackend();
  // The viewer saves through the backend's commit; without it there is
  // nowhere for its edits to go.
  const available = useCapability("annotations.commit");
  const initialSelectedImageIds = useSelector(selectSelectedImageIds);
  const allAnnotations = useSelector(selectAnnotationEntities);
  const kindStates = useSelector(selectKindStates);
  const [resolving, setResolving] = useState(false);

  const selectedAnnotationIds = useMemo(
    () => Object.values(kindStates).flatMap((ks) => ks.selectedIds),
    [kindStates],
  );

  const canNavigate =
    initialSelectedImageIds.length > 0 || selectedAnnotationIds.length > 0;

  const handleNavigateImageViewer = async () => {
    if (resolving) return;
    const known = selectedAnnotationIds.flatMap((id) => {
      const annotation = allAnnotations[id];
      return annotation ? [annotation.imageId] : [];
    });
    const unknown = selectedAnnotationIds.filter((id) => !allAnnotations[id]);
    let annotatedImageIds = known;
    if (unknown.length > 0) {
      setResolving(true);
      try {
        annotatedImageIds = [
          ...known,
          ...(await imagesOfAnnotations(backend, unknown)),
        ];
      } finally {
        setResolving(false);
      }
    }
    const imageIds = [
      ...new Set([...initialSelectedImageIds, ...annotatedImageIds]),
    ];
    navigate("/imageviewer", {
      state: {
        selectedItems: { imageIds, annotationIds: selectedAnnotationIds },
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
      onClick={() => void handleNavigateImageViewer()}
      help={HelpItem.NavigateImageViewer}
      disabled={!canNavigate || !available || resolving}
    />
  );
};
