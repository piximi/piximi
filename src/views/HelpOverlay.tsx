import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Snackbar,
  Typography,
} from "@mui/material";
import { useHelp } from "contexts";
import { useEffect, useState } from "react";
import {
  helpContent,
  HelpItem,
} from "components/layout/HelpDrawer/HelpContent";

const HelpOverlay = () => {
  const { helpMode, setHelpMode } = useHelp()!;
  const [helpText, setHelpText] = useState<string | null>(null);
  const [lastTarget, setLastTarget] = useState<HTMLElement | null>(null);
  const [helpItem, setHelpItem] = useState<HelpItem | null>(null);

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

    const handleClick = (e: MouseEvent) => {
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
    document.addEventListener("mousemove", handleClick, true);
    return () => document.removeEventListener("mousemove", handleClick, true);
  }, [helpMode, lastTarget]);

  useEffect(() => {
    console.log(!!helpText);
  }, [helpText]);

  return (
    <>
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
              backgroundColor: theme.palette.info.main,
              fontSize: 14,
            })}
            slotProps={{
              title: { variant: "body1" },
              subheader: { variant: "body2" },
            }}
          />
          <CardContent>
            <Typography sx={{ color: "text.secondary", mb: 1.5 }}>
              {helpItem}
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
        {/* <Alert severity="info" variant="filled" sx={{ width: "100%" }}>
          {helpText ? helpText : "Help Mode Active (H+Shift to toggle)"}
        </Alert> */}
      </Snackbar>
      {/* <Snackbar
        open={!!helpText}
        sx={{ minWidth: "max-content" }}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity="info" variant="filled" sx={{ width: "100%" }}>
          {helpText}
        </Alert>
      </Snackbar> */}
      {/* <Popper
        open={!!helpText}
        anchorEl={docRef.current}
        placement="bottom-end"
        modifiers={[{ name: "offset", options: { offset: [-20, -200] } }]}
      >
        <Box
          sx={(theme) => ({
            width: "200px",
            height: "200px",
            backgroundColor: "paper",
            border: "1px solid white",
            borderRadius: theme.shape.borderRadius,
          })}
        >
          <Typography>{helpText}</Typography>
        </Box>
      </Popper> */}
    </>
  );
};

export default HelpOverlay;
