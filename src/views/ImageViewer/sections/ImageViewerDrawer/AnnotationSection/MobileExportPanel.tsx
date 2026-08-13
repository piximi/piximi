import { useSelector } from "react-redux";

import { selectExperiment } from "store/data/selectors";

import { ExportOptionsPanel } from "./ExportOptionsPanel";
import { useAnnotationSelection } from "./useAnnotationSelection";

import type { OpScope } from "./types";

/**
 * The mobile Export tool's content. Reuses the same useAnnotationSelection
 * scoping and the shared ExportOptionsPanel the desktop selection footer's
 * popover renders, rather than a second export implementation.
 */
export const MobileExportPanel = () => {
  const { selectedIds, view, planeCount, annotations, idsForScope } =
    useAnnotationSelection();
  const experiment = useSelector(selectExperiment);

  const scopes: OpScope[] = [
    { id: "selected", label: "Selected", count: selectedIds.length },
    { id: "view", label: "In view", count: view.length },
    { id: "plane", label: "This plane", count: planeCount },
    { id: "image", label: "Whole image", count: annotations.length },
  ];

  return (
    <ExportOptionsPanel
      scopes={scopes}
      scopeToAnnotations={idsForScope}
      experimentName={experiment.name}
      onExported={() => {}}
    />
  );
};
