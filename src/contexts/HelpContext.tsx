import { Box } from "@mui/material";
import { createContext, useContext, useState } from "react";
import "./help.css";

const HelpContext = createContext<null | {
  helpMode: boolean;
  setHelpMode: React.Dispatch<React.SetStateAction<boolean>>;
}>(null);

export const HelpProvider = ({ children }: { children: React.ReactNode }) => {
  const [helpMode, setHelpMode] = useState(false);

  return (
    <HelpContext.Provider value={{ helpMode, setHelpMode }}>
      <Box>{children}</Box>
    </HelpContext.Provider>
  );
};

export const useHelp = () => useContext(HelpContext);
