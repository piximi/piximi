import type { ReactNode } from "react";
import { createContext, useContext, useMemo, useRef, useState } from "react";

import { useSelector } from "react-redux";

import { useRawImageData } from "hooks/useRawImageData";

import type { BitDepth } from "store/dataV2/types";
import { selectActiveImageId } from "@ImageViewer/state/image-viewer-data/selectors";
import { useParameterizedSelector } from "store/hooks";
import { selectActiveExtendedChannels } from "store/dataV2/selectors";

import type { Image as IJSImage } from "image-js-latest";

export const ActiveImageContext = createContext<{
  channelData: Array<{
    bitDepth: BitDepth;
    data: Uint8Array<ArrayBuffer> | Uint16Array<ArrayBuffer>;
  }>;
  channelsLoading: boolean;
  ijsImageRef: React.MutableRefObject<IJSImage | null> | undefined;
  ijsImageVersion: number;
  onIjsImageReady: (img: IJSImage) => void;
  onRawDataRendered: () => void;
}>({
  channelData: [],
  channelsLoading: false,
  ijsImageRef: undefined,
  ijsImageVersion: 0,
  onIjsImageReady: (_img) => {},
  onRawDataRendered: () => {},
});

export const ActiveImageProvider = ({ children }: { children: ReactNode }) => {
  const activeImageId = useSelector(selectActiveImageId);
  const activeChannels = useParameterizedSelector(
    selectActiveExtendedChannels,
    activeImageId ?? "",
  );
  const ijsImageRef = useRef<IJSImage | null>(null);
  const [ijsImageVersion, setIjsImageVersion] = useState(0);

  const { channelData, loading: channelsLoading } =
    useRawImageData(activeChannels);

  const value = useMemo(
    () => ({
      channelData,
      channelsLoading,
      ijsImageRef,
      ijsImageVersion,
      // Callback ThreeStage calls after each render to update the ref
      onIjsImageReady: (img: IJSImage) => {
        ijsImageRef.current = img;
      },
      // Callback ThreeStage calls when raw data changes (triggers tool rebuild)
      onRawDataRendered: () => setIjsImageVersion((v) => v + 1),
    }),
    [channelData, channelsLoading, ijsImageVersion],
  );

  return (
    <ActiveImageContext.Provider value={value}>
      {children}
    </ActiveImageContext.Provider>
  );
};

export const useActiveImage = () => {
  const savedDataState = useContext(ActiveImageContext);

  return savedDataState;
};
