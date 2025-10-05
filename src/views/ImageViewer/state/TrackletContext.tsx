import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useDispatch } from "react-redux";
import { dataSlice } from "store/data";

export type DrawerContextType =
  | "export"
  | "images"
  | "categories"
  | "annotations";
export const TrackletContext = createContext<{
  showTracklets: boolean;
  setShowTracklets: React.Dispatch<React.SetStateAction<boolean>>;
  primaryTrack: string | undefined;
  setPrimaryTrack: React.Dispatch<React.SetStateAction<string | undefined>>;
  secondaryTracks: string[];
  setSecondaryTracks: React.Dispatch<React.SetStateAction<string[]>>;
  handleSplit: () => void;
  handleUndoSplit: () => void;
  handleMerge: () => void;
  handleUndoMerge: () => void;
  canOperate: boolean;
  clearSelectedTracks: () => void;
}>({
  showTracklets: false,
  setShowTracklets: (_value: React.SetStateAction<boolean>) => {},
  primaryTrack: undefined,
  setPrimaryTrack: (_value: React.SetStateAction<string | undefined>) => {},
  secondaryTracks: [],
  setSecondaryTracks: (_value: React.SetStateAction<string[]>) => {},
  handleSplit: () => {},
  handleUndoSplit: () => {},
  handleMerge: () => {},
  handleUndoMerge: () => {},
  canOperate: false,
  clearSelectedTracks: () => {},
});

export const TrackletProvider = ({ children }: { children: ReactNode }) => {
  const dispatch = useDispatch();
  const [showTracklets, setShowTracklets] = useState(false);
  const [primaryTrack, setPrimaryTrack] = useState<string>();
  const [secondaryTracks, setSecondaryTracks] = useState<string[]>([]);

  const canOperate = useMemo(
    () => primaryTrack !== undefined && secondaryTracks.length > 0,
    [primaryTrack, secondaryTracks],
  );
  const clearSelectedTracks = useCallback(() => {
    setPrimaryTrack(undefined);
    setSecondaryTracks([]);
  }, []);
  const handleSplit = useCallback(() => {
    if (!primaryTrack || secondaryTracks.length === 0) return;
    dispatch(
      dataSlice.actions.addChildrenToTrack({
        parentId: primaryTrack,
        childIds: secondaryTracks,
      }),
    );
    clearSelectedTracks();
  }, [primaryTrack, secondaryTracks, clearSelectedTracks]);

  const handleUndoSplit = useCallback(() => {
    if (!primaryTrack || secondaryTracks.length === 0) return;
    dispatch(
      dataSlice.actions.removeChildrenFromTrack({
        parentId: primaryTrack,
        childIds: secondaryTracks,
      }),
    );
    clearSelectedTracks();
  }, [primaryTrack, secondaryTracks, clearSelectedTracks]);

  const handleMerge = useCallback(() => {
    if (!primaryTrack || secondaryTracks.length === 0) return;
    dispatch(
      dataSlice.actions.addParentsToTrack({
        parentIds: secondaryTracks,
        childId: primaryTrack,
      }),
    );
    clearSelectedTracks();
  }, [primaryTrack, secondaryTracks, clearSelectedTracks]);
  const handleUndoMerge = useCallback(() => {
    if (!primaryTrack || secondaryTracks.length === 0) return;
    dispatch(
      dataSlice.actions.removeParentsFromTrack({
        parentIds: secondaryTracks,
        childId: primaryTrack,
      }),
    );
    clearSelectedTracks();
  }, [primaryTrack, secondaryTracks, clearSelectedTracks]);

  return (
    <TrackletContext.Provider
      value={{
        showTracklets,
        setShowTracklets,
        primaryTrack,
        setPrimaryTrack,
        secondaryTracks,
        setSecondaryTracks,
        handleMerge,
        handleSplit,
        handleUndoMerge,
        handleUndoSplit,
        canOperate,
        clearSelectedTracks,
      }}
    >
      {children}
    </TrackletContext.Provider>
  );
};

export const useShouldShowTracklets = () => {
  const trackletContext = useContext(TrackletContext);

  return trackletContext.showTracklets;
};

export const useSetShowTracklets = () => {
  const trackletContext = useContext(TrackletContext);

  return trackletContext.setShowTracklets;
};

export const useSelectedTracklets = () => {
  const { primaryTrack, setPrimaryTrack, secondaryTracks, setSecondaryTracks } =
    useContext(TrackletContext);

  return { primaryTrack, secondaryTracks, setPrimaryTrack, setSecondaryTracks };
};

export const useTrackOperations = () => {
  const {
    handleMerge,
    handleSplit,
    handleUndoMerge,
    handleUndoSplit,
    canOperate,
    clearSelectedTracks,
  } = useContext(TrackletContext);
  return {
    handleMerge,
    handleSplit,
    handleUndoMerge,
    handleUndoSplit,
    canOperate,
    clearSelectedTracks,
  };
};
