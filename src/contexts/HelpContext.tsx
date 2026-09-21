import { createContext, useContext, useState } from "react";

const HelpContext = createContext<null | {
  helpMode: boolean;
  setHelpMode: React.Dispatch<React.SetStateAction<boolean>>;
}>(null);

export const HelpProvider = ({ children }: { children: React.ReactNode }) => {
  const [helpMode, setHelpMode] = useState(false);

  return (
    <HelpContext.Provider value={{ helpMode, setHelpMode }}>
      {children}
    </HelpContext.Provider>
  );
};

export const useHelp = () => {
  const ctx = useContext(HelpContext);
  if (!ctx) throw new Error("useHelp must be used within a HelpProvider");
  return ctx;
};
