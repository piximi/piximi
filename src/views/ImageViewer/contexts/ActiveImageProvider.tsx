import { createContext, useContext, useMemo, useState } from "react";

import { useSelector } from "react-redux";

import { useRawImageData } from "hooks";

import { useParameterizedSelector } from "store/hooks";
import { selectActiveExtendedChannels } from "store/data/selectors";

import { selectActiveImageId } from "@ImageViewer/state/imageViewerData/selectors";

import type { ReactNode } from "react";

import type { Image as IJSImage } from "image-js-latest";

import type { BitDepth } from "core/entities";

const ActiveImageContext = createContext<{
  channelData: Array<{
    bitDepth: BitDepth;
    data: Uint8Array<ArrayBuffer> | Uint16Array<ArrayBuffer>;
  }>;
  channelsLoading: boolean;
  ijsImage: IJSImage | null;
  setIjsImage: (v: IJSImage | null) => void;
}>({
  channelData: [],
  channelsLoading: false,
  ijsImage: null,
  setIjsImage: () => {},
});

export const ActiveImageProvider = ({ children }: { children: ReactNode }) => {
  const activeImageId = useSelector(selectActiveImageId);
  const activeChannels = useParameterizedSelector(
    selectActiveExtendedChannels,
    activeImageId ?? "",
  );
  const [ijsImage, setIjsImage] = useState<IJSImage | null>(null);

  const { channelData, loading: channelsLoading } =
    useRawImageData(activeChannels);

  const value = useMemo(
    () => ({
      channelData,
      channelsLoading,
      ijsImage,
      setIjsImage,
    }),
    [channelData, channelsLoading, ijsImage],
  );

  return (
    <ActiveImageContext.Provider value={value}>
      {children}
    </ActiveImageContext.Provider>
  );
};

export const useActiveImage = () => {
  const activeImage = useContext(ActiveImageContext);

  return activeImage;
};
