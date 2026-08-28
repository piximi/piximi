import type { RefObject } from "react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";

import { Box, IconButton, Typography } from "@mui/material";
import { Add as AddAllIcon, Remove as RemovAllIcon } from "@mui/icons-material";

import { FilterChip } from "./FilterChip";
import {
  chipFrameStyle,
  chipListStyle,
  sectionLabelStyle,
  sectionStyle,
} from "./FilterList.styles";

type FilterListProps<T> = {
  items: Array<T>;
  onToggle: (item: T) => void;
  onToggleAll: (filtered: boolean) => void;
  isFiltered: (item: T) => boolean;
  allFiltered: boolean;
  noneFiltered: boolean;
  getId: (item: T) => string;
  getName: (item: T) => string;
  getColor: (item: T) => string | undefined;
};

const useObservedHeight = (ref: RefObject<HTMLElement | null>) => {
  const [height, setHeight] = useState<number>();
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const ro = new ResizeObserver(([entry]) => {
      setHeight(entry.contentRect.height);
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, []);
  return height;
};

export function FilterList<T>({
  items,
  onToggle,
  onToggleAll,
  isFiltered,
  allFiltered,
  noneFiltered,
  getId,
  getName,
  getColor,
}: FilterListProps<T>) {
  const filteredContentRef = useRef<HTMLDivElement>(null);
  const visibleContentRef = useRef<HTMLDivElement>(null);
  const filteredHeight = useObservedHeight(filteredContentRef);
  const visibleHeight = useObservedHeight(visibleContentRef);

  const { filtered, visible } = useMemo(
    () =>
      items.reduce(
        (r: { filtered: Array<T>; visible: Array<T> }, i) => {
          if (isFiltered(i)) r.filtered.push(i);
          else r.visible.push(i);
          return r;
        },
        { filtered: [], visible: [] },
      ),
    [items, isFiltered],
  );

  return (
    <Box
      sx={{
        maxWidth: "100%",
        display: "flex",
        flexDirection: "column",
        py: 1,
      }}
    >
      <Box sx={sectionStyle}>
        <Box sx={sectionLabelStyle}>
          <Typography variant="caption" sx={{ mr: 1 }}>
            Filtered
          </Typography>
          <IconButton
            size="small"
            sx={{ p: 0, m: 0 }}
            onClick={() => onToggleAll(false)}
            disabled={noneFiltered}
          >
            <RemovAllIcon
              sx={(theme) => ({
                fontSize: theme.typography.body1.fontSize,
                fontWeight: "bold",
              })}
            />
          </IconButton>
          <IconButton
            size="small"
            sx={{ p: 0, m: 0 }}
            onClick={() => onToggleAll(true)}
            disabled={allFiltered}
          >
            <AddAllIcon
              sx={(theme) => ({
                fontSize: theme.typography.body1.fontSize,
                fontWeight: "bold",
              })}
            />
          </IconButton>
        </Box>

        <Box sx={chipFrameStyle(filteredHeight, true)}>
          <Box ref={filteredContentRef} sx={chipListStyle}>
            {filtered.length === 0 ? (
              <FilterChip
                label="placeholder"
                color="transparent"
                isFiltered={false}
                sx={{ visibility: "hidden" }}
              />
            ) : (
              filtered.map((item) => {
                return (
                  <FilterChip
                    key={`filtered-chip-${getId(item)}`}
                    label={getName(item)}
                    color={getColor(item)}
                    onDelete={() => onToggle(item)}
                    isFiltered={true}
                  />
                );
              })
            )}
          </Box>
        </Box>
      </Box>
      <Box sx={sectionStyle}>
        <Box sx={sectionLabelStyle}>
          <Typography variant="caption" sx={{ mr: 1 }}>
            Visible
          </Typography>
        </Box>
        <Box sx={chipFrameStyle(visibleHeight, true)}>
          <Box ref={visibleContentRef} sx={chipListStyle}>
            {visible.length === 0 ? (
              <FilterChip
                label="placeholder"
                color="transparent"
                isFiltered={false}
                sx={{ visibility: "hidden" }}
              />
            ) : (
              visible.map((item) => {
                return (
                  <FilterChip
                    key={`visible-chip-${getId(item)}`}
                    label={getName(item)}
                    color={getColor(item)}
                    onClick={() => onToggle(item)}
                    isFiltered={false}
                  />
                );
              })
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
