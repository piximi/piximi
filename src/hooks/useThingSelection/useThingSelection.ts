import { intersection } from "lodash";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { projectSlice } from "store/project";
import { selectActiveThings } from "store/project/reselectors";
import {
  selectActiveKindId,
  selectActiveThingFilters,
  selectSelectedThingIds,
} from "store/project/selectors";
import { isFiltered } from "utils/common/helpers";

export const useThingSelection = () => {
  const dispatch = useDispatch();
  const activeKind = useSelector(selectActiveKindId);
  const activeThings = useSelector(selectActiveThings);
  const thingFilters = useSelector(selectActiveThingFilters);
  const selectedThingIds = useSelector(selectSelectedThingIds);
  const [unfilteredThings, setUnfilteredThings] = useState<string[]>([]);
  const [allSelected, setAllSelected] = useState<boolean>(false);
  const [unfilteredSelectedThings, setUnfilteredSelectedThings] = useState<
    string[]
  >([]);

  const handleSelectAll = () => {
    dispatch(projectSlice.actions.selectThings({ ids: unfilteredThings }));
  };
  const handleDeselectAll = () => {
    dispatch(projectSlice.actions.deselectThings({ ids: unfilteredThings }));
  };

  useEffect(() => {
    if (activeKind) {
      const _unfilteredThingIds = activeThings.reduce(
        (thingIds: string[], thing) => {
          if (!isFiltered(thing, thingFilters ?? {})) {
            thingIds.push(thing.id);
          }
          return thingIds;
        },
        []
      );
      setUnfilteredThings(_unfilteredThingIds);
    }
  }, [activeKind, activeThings, thingFilters]);

  useEffect(() => {
    const _unfilteredSelectedThings = intersection(
      selectedThingIds,
      unfilteredThings
    );
    setUnfilteredSelectedThings(_unfilteredSelectedThings);
    setAllSelected(
      _unfilteredSelectedThings.length === unfilteredThings.length
    );
  }, [selectedThingIds, unfilteredThings]);

  return {
    allSelected,
    unfilteredSelectedThings,
    allSelectedThingIds: selectedThingIds,
    handleSelectAll,
    handleDeselectAll,
  };
};
