import type { RefObject } from "react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { Box, Collapse, IconButton, Stack, Typography } from "@mui/material";
import {
  VisibilityOutlined as VisibilityOutlinedIcon,
  VisibilityOffOutlined as VisibilityOffOutlinedIcon,
  ExpandLess as ExpandLessIcon,
} from "@mui/icons-material";

import { FunctionalDivider } from "components/ui";
import { TooltipWithDisable } from "components/ui/tooltips/TooltipWithDisable";

import { FilterChip } from "./FilterChip";
import {
  chipFrameStyle,
  chipListStyle,
  expandToggleStyle,
  sectionLabelStyle,
  sectionStyle,
} from "./FilterList.styles";

type FilterListProps<T> = {
  title?: string;
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

export const useObservedHeight = (ref: RefObject<HTMLElement | null>) => {
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
const SectionHeader = ({
  title,
  onToggleAll,
  allFiltered,
  noneFiltered,
}: {
  title: string;
  onToggleAll: (filtered: boolean) => void;
  allFiltered: boolean;
  noneFiltered: boolean;
}) => {
  return (
    <FunctionalDivider
      headerText={title}
      typographyVariant="caption"
      actions={
        <Stack direction="row">
          <TooltipWithDisable title={"Show all"}>
            <IconButton
              onClick={() => onToggleAll(false)}
              disabled={noneFiltered}
            >
              <VisibilityOutlinedIcon fontSize="small" />
            </IconButton>
          </TooltipWithDisable>
          <TooltipWithDisable title={"Filter all"}>
            <IconButton
              onClick={() => onToggleAll(true)}
              disabled={allFiltered}
            >
              <VisibilityOffOutlinedIcon fontSize="small" />
            </IconButton>
          </TooltipWithDisable>
        </Stack>
      }
    />
  );
};

export function FilterList<T>({
  title,
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
  const [showVisible, setShowVisible] = useState(false);

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

  useEffect(() => {
    // collapse visible container if empty, expand if no filtered
    if (visible.length === 0 || filtered.length === 0) {
      setShowVisible(filtered.length === 0);
    }
  }, [visible.length, filtered.length]);

  return (
    <Box
      sx={{
        maxWidth: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {title && (
        <SectionHeader
          title={title}
          onToggleAll={onToggleAll}
          allFiltered={allFiltered}
          noneFiltered={noneFiltered}
        />
      )}
      <Box sx={sectionStyle}>
        <Typography variant="caption" sx={sectionLabelStyle}>
          Filtered
        </Typography>
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
        <Typography variant="caption" sx={sectionLabelStyle}>
          Visible
        </Typography>
        <IconButton
          onClick={() => {
            setShowVisible((v) => !v);
          }}
          disabled={visible.length === 0}
          sx={(theme) => expandToggleStyle(theme, showVisible)}
        >
          <ExpandLessIcon fontSize="small" />
        </IconButton>
        <Box sx={chipFrameStyle(visibleHeight, showVisible)}>
          <Box ref={visibleContentRef} sx={chipListStyle}>
            <Collapse in={showVisible}>
              {visible.map((item) => {
                return (
                  <FilterChip
                    key={`visible-chip-${getId(item)}`}
                    label={getName(item)}
                    color={getColor(item)}
                    onClick={() => onToggle(item)}
                    isFiltered={false}
                  />
                );
              })}
            </Collapse>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
