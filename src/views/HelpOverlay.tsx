import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  GlobalStyles,
  Snackbar,
  Typography,
} from "@mui/material";
import { Lock as LockIcon } from "@mui/icons-material";
import { useHelp } from "contexts";
import React, { useEffect, useMemo, useState } from "react";
import {
  helpContent,
  HelpItem,
} from "components/layout/HelpDrawer/HelpContent";
import { ThemeMode } from "themes/enums";
import { formatString } from "utils/common/helpers";

const HelpOverlay = () => {
  const { helpMode, setHelpMode } = useHelp()!;
  const [helpText, setHelpText] = useState<string | null>(null);
  const [lastTarget, setLastTarget] = useState<HTMLElement | null>(null);
  const [helpItem, setHelpItem] = useState<HelpItem | null>(null);
  const [priorityHelp, setPriotityHelp] = useState<HelpItem | null>(null);

  const helpToggle = (event: KeyboardEvent) => {
    if (event.key === "H" && event.shiftKey) {
      setHelpMode((helpMode) => {
        console.log(helpMode ? "Help mode off" : "Help mode on");
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
      let currentTarget = e.target as HTMLElement;
      let helpItem = currentTarget.getAttribute("data-help");
      let parentLevel = 0;
      while (currentTarget && currentTarget.parentElement && !helpItem) {
        helpItem = currentTarget.getAttribute("data-help");
        if (helpItem || parentLevel >= 3) break;

        currentTarget = currentTarget.parentElement;
        parentLevel++;
      }
      if (currentTarget === lastTarget) return;
      setLastTarget(currentTarget);
      if (helpItem) {
        const helpText = helpContent["help-items"][helpItem as HelpItem]
          ? helpContent["help-items"][helpItem as HelpItem].brief
          : null;
        setHelpText(helpText);
        setHelpItem(helpItem as HelpItem);
        e.preventDefault();
        e.stopPropagation();
      }
    };
    const handleClick = (e: MouseEvent) => {
      if (!e.shiftKey) return;

      e.preventDefault();
      e.stopPropagation();

      let currentTarget = e.target as HTMLElement;
      let _helpItem = currentTarget.getAttribute("data-help");
      let parentLevel = 0;
      while (currentTarget && currentTarget.parentElement && !_helpItem) {
        _helpItem = currentTarget.getAttribute("data-help");

        if (_helpItem || parentLevel >= 3) break;

        currentTarget = currentTarget.parentElement;
        parentLevel++;
      }
      if (priorityHelp === _helpItem) {
        setPriotityHelp(null);
        return;
      }
      setPriotityHelp(_helpItem as HelpItem);

      if (_helpItem && _helpItem !== helpItem) {
        const helpText = helpContent["help-items"][_helpItem as HelpItem]
          ? helpContent["help-items"][_helpItem as HelpItem].brief
          : null;
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
                outline: `2px dashed ${theme.palette.info.main}`,
                outlineOffset: "-3px",
              }
            : {},
          [`html [data-help=${priorityHelp ?? "undefined"}]`]: {
            outlineColor: theme.palette.secondary.main,
          },
        })}
      />
    ),
    [helpMode, priorityHelp]
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
            minWidth: 275,
            maxWidth: 275,
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
            <Typography variant="body2">{helpText}</Typography>
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
