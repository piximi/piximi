import { createContext, ReactNode, useContext, useState } from "react";
import { CenterOfMass } from "utils/tracking";

export const TrackContext = createContext<{
  trackCOM: Record<string, CenterOfMass[]>;
  setTrackCOM: React.Dispatch<
    React.SetStateAction<Record<string, CenterOfMass[]>>
  >;
}>({
  trackCOM: {},
  setTrackCOM: (
    _trackCOM: React.SetStateAction<Record<string, CenterOfMass[]>>,
  ) => {},
});

export const TrackProvider = ({ children }: { children: ReactNode }) => {
  const [trackCOM, setTrackCOM] = useState<Record<string, CenterOfMass[]>>({});

  const wrappedSetTrackCOM: typeof setTrackCOM = (value) => {
    console.log("📦 TrackProvider: setTrackCOM called with:", value);
    setTrackCOM((prev) => {
      console.log("📦 TrackProvider: Previous value:", prev);
      const newValue = typeof value === "function" ? value(prev) : value;
      console.log("📦 TrackProvider: New value:", newValue);
      console.log("📦 TrackProvider: Same reference?", prev === newValue);
      return newValue;
    });
  };

  return (
    <TrackContext.Provider
      value={{ trackCOM, setTrackCOM: wrappedSetTrackCOM }}
    >
      {children}
    </TrackContext.Provider>
  );
};

export const useSetTrackCOM = () => {
  return useContext(TrackContext).setTrackCOM;
};

export const useTrackCOM = () => {
  return useContext(TrackContext).trackCOM;
};
