import { Box, GlobalStyles } from "@mui/material";
import { createContext, useContext, useEffect, useState } from "react";
import "./help.css";

const HelpContext = createContext<null | {
  helpMode: boolean;
  setHelpMode: React.Dispatch<React.SetStateAction<boolean>>;
}>(null);

export const HelpProvider = ({ children }: { children: React.ReactNode }) => {
  const [helpMode, setHelpMode] = useState(false);

  useEffect(() => {
    if (helpMode) {
      document.body.className = "help-info";
    } else {
      document.body.className = "";
    }
  }, [helpMode]);
  return (
    <HelpContext.Provider value={{ helpMode, setHelpMode }}>
      <GlobalStyles
        styles={(theme) => ({
          "html [data-help]": helpMode
            ? {
                outline: `2px dashed ${theme.palette.info.main}`,
                "outline-offset": "-3px",
              }
            : {},
        })}
      />
      <Box>{children}</Box>
    </HelpContext.Provider>
  );
};

export const useHelp = () => useContext(HelpContext);
