import { useMemo, useState } from "react";

import { useDispatch, useSelector } from "react-redux";

import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";

import { Box, Chip, Stack, Typography } from "@mui/material";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";

import { selectActivePivotItems } from "@MeasurementViewer/state/selectors";
import { measurementsSlice } from "@MeasurementViewer/state/measurementsSlice";
import { selectActiveInitialPivotDimensions } from "@MeasurementViewer/state/reselectors";

import { DroppableZone } from "./DroppableZone";
import { ExpandableDimensionChip } from "./ExpandableDimensionChip";
import { SortableDimensionChip } from "./SortableDimensionChip";

import type {
  Dimension,
  DimensionValue,
  PivotItem,
} from "@MeasurementViewer/types";
import type {
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from "@dnd-kit/core";

export const PivotConfigurator = () => {
  // Main dimensions always stay in available (they don't move)
  const dispatch = useDispatch();
  //const [dimensions, setDimensions] = useState<Dimension[]>(INITIAL_DIMENSIONS);
  const initialPivotDimensions = useSelector(
    selectActiveInitialPivotDimensions,
  );
  const initialPivotItems = useSelector(selectActivePivotItems);
  // Items currently in the pivot zone
  const [pivotItems, setPivotItems] = useState<PivotItem[]>(initialPivotItems);

  // Track what's being dragged
  const [activeItem, setActiveItem] = useState<{
    id: string;
    label: string;
    isMainDimension: boolean;
  } | null>(null);

  // Track which dimension's popover is expanded
  const [expandedDimensionId, setExpandedDimensionId] = useState<string | null>(
    null,
  );

  const handleExpandToggle = (id: string, expanded: boolean) => {
    setExpandedDimensionId(expanded ? id : null);
  };

  const dimensions = useMemo(
    () =>
      initialPivotDimensions.filter(
        (item) => !pivotItems.map((pItem) => pItem.id).includes(item.id),
      ),
    [pivotItems],
  );

  // Configure sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Find if an item is in the pivot zone
  const isInPivotZone = (id: string): boolean => {
    return pivotItems.some((item) => item.id === id);
  };

  // Find which container an item belongs to
  const findContainer = (
    id: string,
  ): "available" | "pivot" | "popover" | null => {
    // Check if it's a main dimension
    if (dimensions.some((d) => d.id === id)) return "available";

    // Check if it's in pivot zone
    if (pivotItems.some((item) => item.id === id)) return "pivot";

    // Check if it's a value inside a popover (not yet in pivot)
    for (const dim of dimensions) {
      if (dim.values.some((v) => v.id === id)) {
        return "popover";
      }
    }

    return null;
  };

  // Find dimension value by id
  const findDimensionValue = (id: string): DimensionValue | undefined => {
    for (const dim of dimensions) {
      const value = dim.values.find((v) => v.id === id);
      if (value) return value;
    }
    return undefined;
  };

  // Find main dimension by id
  const findMainDimension = (id: string): Dimension | undefined => {
    return dimensions.find((d) => d.id === id);
  };

  const findInitialDimension = (id: string): Dimension | undefined => {
    return initialPivotDimensions.find((d) => d.id === id);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const id = active.id as string;

    // Close any open popover when drag starts
    setExpandedDimensionId(null);

    // Check if it's a main dimension
    const mainDim = findMainDimension(id);
    if (mainDim) {
      const pivotItem = pivotItems.find((item) => item.id === id);
      if (pivotItem) {
        return;
      }
      setActiveItem({ id, label: mainDim.label, isMainDimension: true });
      return;
    }

    // Check if it's a specific value
    const value = findDimensionValue(id);
    if (value) {
      setActiveItem({ id, label: value.label, isMainDimension: false });
      return;
    }

    // Check if it's already in pivot zone
    const pivotItem = pivotItems.find((item) => item.id === id);
    if (pivotItem) {
      setActiveItem({
        id,
        label: pivotItem.label,
        isMainDimension: pivotItem.isMainDimension,
      });
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = active.id as string;
    const overId = over.id as string;

    const activeContainer = findContainer(activeId);

    const overContainer =
      overId === "available" || overId === "pivot"
        ? overId
        : overId.startsWith("popover-")
          ? "popover"
          : findContainer(overId);

    // Don't do anything if same container or invalid
    if (!activeContainer || !overContainer) return;
    if (activeContainer === overContainer) return;

    // Moving TO pivot zone
    if (overContainer === "pivot") {
      // From available (main dimension) - add all values
      if (activeContainer === "available") {
        const mainDim = findMainDimension(activeId);
        if (mainDim && !pivotItems.some((item) => item.id === activeId)) {
          //setDimensions((prev) => prev.filter((item) => item.id !== activeId));
          setPivotItems((prev) => [
            ...prev,
            { id: activeId, label: mainDim.label, isMainDimension: true },
          ]);
        }
      }
      // From popover (specific value) - add just this value
      else if (activeContainer === "popover") {
        const value = findDimensionValue(activeId);
        if (value && !pivotItems.some((item) => item.id === activeId)) {
          setPivotItems((prev) => [
            ...prev,
            {
              id: activeId,
              label: value.label,
              parentId: value.parentId,
              isMainDimension: false,
            },
          ]);
        }
      }
    }

    // Moving FROM pivot zone back to available/popover - remove it
    if (
      activeContainer === "pivot" &&
      (overContainer === "available" || overContainer === "popover")
    ) {
      setPivotItems((prev) => prev.filter((item) => item.id !== activeId));
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);
    if (!over) return;

    let currentPivotItems = pivotItems;
    const activeId = active.id as string;
    const overId = over.id as string;

    const overContainer =
      overId === "available" || overId === "pivot"
        ? overId
        : overId.startsWith("popover-")
          ? "popover"
          : findContainer(overId);

    if (overContainer === "pivot") {
      const mainDim = findInitialDimension(activeId);
      if (mainDim) {
        currentPivotItems = pivotItems.filter(
          (item) => item.parentId !== mainDim.id,
        );
        setPivotItems((prev) =>
          prev.filter((item) => item.parentId !== mainDim.id),
        );
      }
    }
    const reorder = (items: PivotItem[]) => {
      const oldIndex = items.findIndex((item) => item.id === activeId);
      const newIndex = items.findIndex((item) => item.id === overId);
      if (oldIndex !== -1 && newIndex !== -1) {
        return arrayMove(items, oldIndex, newIndex);
      }
      return items;
    };
    // Handle reordering within pivot zone
    if (isInPivotZone(activeId) && isInPivotZone(overId)) {
      currentPivotItems = reorder(currentPivotItems);
      setPivotItems(reorder);
    }
    dispatch(
      measurementsSlice.actions.updateActivePivotItems(currentPivotItems),
    );
  };

  // Get values for a dimension that are NOT already in the pivot zone
  const getAvailableValues = (dimensionId: string): DimensionValue[] => {
    const dim = findMainDimension(dimensionId);
    if (!dim) return [];

    // Filter out values that are already in pivot zone
    return dim.values.filter(
      (v) => !pivotItems.some((item) => item.id === v.id),
    );
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Configure Pivot Table
      </Typography>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <Stack spacing={2}>
          {/* Available Dimensions */}
          <DroppableZone
            id="available"
            title="Available Dimensions"
            itemIds={dimensions.map((d) => d.id)}
            emptyMessage="No dimensions available"
          >
            {dimensions.map((dim) => (
              <ExpandableDimensionChip
                key={dim.id}
                id={dim.id}
                label={dim.label}
                values={getAvailableValues(dim.id)}
                isExpanded={expandedDimensionId === dim.id}
                onExpandToggle={handleExpandToggle}
              />
            ))}
          </DroppableZone>

          {/* Pivot By Zone */}
          <DroppableZone
            id="pivot"
            title="Column Grouping (order matters)"
            itemIds={pivotItems.map((item) => item.id)}
            emptyMessage="Drag dimensions here to group by"
          >
            {pivotItems.map((item) => (
              <SortableDimensionChip
                key={item.id}
                id={item.id}
                label={
                  item.isMainDimension
                    ? `${item.label} (all)`
                    : `${findInitialDimension(item.parentId!)?.label}: ${item.label}`
                }
              />
            ))}
          </DroppableZone>
        </Stack>

        {/* Drag overlay */}
        <DragOverlay>
          {activeItem ? (
            <Chip
              icon={<DragIndicatorIcon fontSize="small" />}
              label={activeItem.label}
              size="small"
              sx={{
                cursor: "grabbing",
                boxShadow: 3,
              }}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Debug output */}
      {pivotItems.length > 0 && (
        <Box sx={{ mt: 2, p: 1, bgcolor: "action.hover", borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Pivot order:{" "}
            {pivotItems
              .map((item) =>
                item.isMainDimension
                  ? `${item.label}(*)`
                  : `${item.parentId}:${item.label}`,
              )
              .join(" → ")}
          </Typography>
        </Box>
      )}
    </Box>
  );
};
