import { useEffect, useMemo, useState } from "react";

import { MuiMarkdown, getOverrides } from "mui-markdown";

import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  GlobalStyles,
  Snackbar,
  Typography,
  useTheme,
} from "@mui/material";
import { Lock as LockIcon } from "@mui/icons-material";

import { useHelp } from "contexts";

import { logger } from "utils/logUtils";
import { formatString } from "utils/stringUtils";

import { helpContent } from "data/help/HelpContent";

import type { HelpItem } from "data/help/HelpContent";

// MUI only blocks real clicks on disabled elements that render as a native
// <button> (via the HTML `disabled` attribute); components that render as a
// <div> (e.g. Chip) rely solely on `pointer-events: none` for both hover and
// click suppression, with no JS-level guard on their `onClick`. Restoring
// pointer-events for hover (see globalStyles below) would make those
// click-through again, so the same elements are also used to block their
// clicks in handleClick.
const DISABLED_HELP_SELECTOR =
  "[data-help].Mui-disabled, [data-help][disabled]";
const DISABLED_HELP_SELECTOR_SCOPED =
  "html [data-help].Mui-disabled, html [data-help][disabled]";

const findHelpTarget = (start: HTMLElement, maxDepth = 3) => {
  let target = start;
  let helpItem = target.getAttribute("data-help");
  let depth = 0;
  while (target.parentElement && !helpItem && depth < maxDepth) {
    target = target.parentElement;
    helpItem = target.getAttribute("data-help");
    depth++;
  }
  return { target, helpItem };
};

const HelpOverlay = () => {
  const muiTheme = useTheme();
  const { helpMode, setHelpMode } = useHelp();
  const [helpText, setHelpText] = useState<string | null>(null);
  const [lastTarget, setLastTarget] = useState<HTMLElement | null>(null);
  const [helpItem, setHelpItem] = useState<HelpItem | null>(null);
  const [priorityHelp, setPriorityHelp] = useState<HelpItem | null>(null);

  const helpToggle = (event: KeyboardEvent) => {
    if (event.key === "H" && event.shiftKey) {
      setHelpMode((helpMode) => {
        logger(helpMode ? "Help mode off" : "Help mode on");
        return !helpMode;
      });
    }
  };
  useEffect(() => {
    document.addEventListener("keydown", helpToggle);

    return () => {
      document.removeEventListener("keydown", helpToggle);
    };
  }, []);
  useEffect(() => {
    if (!helpMode) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (priorityHelp) return;
      const { target: currentTarget, helpItem } = findHelpTarget(
        e.target as HTMLElement,
      );
      if (currentTarget === lastTarget) return;
      setLastTarget(currentTarget);
      if (helpItem) {
        const helpText = helpContent[helpItem as HelpItem] ?? null;
        setHelpText(helpText);
        setHelpItem(helpItem as HelpItem);
        e.preventDefault();
        e.stopPropagation();
      }
    };
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest(DISABLED_HELP_SELECTOR)) {
        e.preventDefault();
        e.stopPropagation();
      }

      if (!e.shiftKey) return;

      e.preventDefault();
      e.stopPropagation();

      const { helpItem: _helpItem } = findHelpTarget(target);
      if (priorityHelp === _helpItem) {
        setPriorityHelp(null);
        return;
      }
      setPriorityHelp(_helpItem as HelpItem);

      if (_helpItem && _helpItem !== helpItem) {
        const helpText = helpContent[_helpItem as HelpItem] ?? null;
        setHelpText(helpText);
        setHelpItem(_helpItem as HelpItem);
      }
    };
    document.addEventListener("mousemove", handleMouseMove, true);
    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove, true);
      document.removeEventListener("click", handleClick, true);
    };
  }, [helpMode, lastTarget, priorityHelp]);

  const globalStyles = useMemo(
    () => (
      <GlobalStyles
        styles={(theme) => ({
          "html [data-help]": helpMode
            ? {
                boxShadow: `inset 0 0 0.5rem 1px ${theme.palette.info.main}`,
              }
            : {},
          // MUI sets pointer-events: none on disabled controls, which removes
          // them from mouse hit-testing entirely - restore it while help mode
          // is on so hovering a disabled data-help element still works.
          // (handleClick below blocks clicks on these so this doesn't also
          // make them actionable.)
          ...(helpMode && {
            [DISABLED_HELP_SELECTOR_SCOPED]: {
              pointerEvents: "auto",
            },
          }),
          ...(priorityHelp && {
            [`html [data-help="${priorityHelp}"]`]: {
              outlineColor: theme.palette.secondary.main,
            },
          }),
        })}
      />
    ),
    [helpMode, priorityHelp],
  );

  return (
    <>
      {globalStyles}
      <Snackbar
        open={helpMode}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        sx={{ minWidth: "max-content", maxWidth: "25%" }}
      >
        <Card
          sx={(theme) => ({
            minWidth: 325,
            maxWidth: 325,
            boxShadow: theme.shadows[15],
          })}
        >
          <CardHeader
            title="Help Mode Active"
            subheader="Shift+H to toggle"
            sx={(theme) => ({
              color: theme.palette.info.contrastText,
              backgroundColor: priorityHelp
                ? theme.palette.secondary.main
                : theme.palette.info.main,
              fontSize: 14,
            })}
            slotProps={{
              title: { variant: "body1" },
              subheader: { variant: "body2" },
            }}
          />
          <CardContent>
            <Typography sx={{ color: "text.secondary", mb: 1.5 }}>
              {helpItem ? formatString(helpItem, "-", "every-word") : ""}
              {priorityHelp && (
                <LockIcon
                  sx={(theme) => ({
                    ml: 1,
                    fontSize: theme.typography.body1.fontSize,
                  })}
                />
              )}
            </Typography>
            <MuiMarkdown
              overrides={{
                ...getOverrides({}),
                p: {
                  props: {
                    style: { fontSize: muiTheme.typography.body2.fontSize },
                  },
                },
                span: {
                  props: {
                    style: { fontSize: muiTheme.typography.body2.fontSize },
                  },
                },
                li: {
                  props: {
                    style: { fontSize: muiTheme.typography.body2.fontSize },
                  },
                },
              }}
            >
              {helpText}
            </MuiMarkdown>
          </CardContent>
          <CardActions>
            <Button
              slot="a"
              href="https://documentation.piximi.app"
              target="_blank"
              rel="noopener noreferrer"
              size="small"
            >
              Documentation
            </Button>
          </CardActions>
        </Card>
      </Snackbar>
    </>
  );
};

export default HelpOverlay;
