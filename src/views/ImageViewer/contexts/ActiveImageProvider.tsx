import { createContext, useContext, useMemo, useState } from "react";

import { useSelector } from "react-redux";

import { useCompositeImage, useRawImageData } from "hooks";

import { useParameterizedSelector } from "store/hooks";
import { selectActiveExtendedChannels } from "store/data/selectors";

import { selectActiveImageId } from "@ImageViewer/state/imageViewerData/selectors";

import type { ReactNode } from "react";

import type { Image as IJSImage } from "image-js-latest";

import type { BitDepth } from "core/entities";

import type { CompositeImage } from "hooks";

/*
 * The active plane's pixels, in whichever form the backend gives them: raw
 * channels (composited on the GPU here) or a composite it rendered. Either
 * way the tools end up with the composited `ijsImage`.
 */
const ActiveImageContext = createContext<{
  channelData: Array<{
    bitDepth: BitDepth;
    data: Uint8Array<ArrayBuffer> | Uint16Array<ArrayBuffer>;
  }>;
  composite: CompositeImage | undefined;
  channelsLoading: boolean;
  ijsImage: IJSImage | null;
  setIjsImage: (v: IJSImage | null) => void;
}>({
  channelData: [],
  composite: undefined,
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

  const { channelData, loading: rawLoading } = useRawImageData(activeChannels);
  const { composite, loading: compositeLoading } =
    useCompositeImage(activeChannels);

  const value = useMemo(
    () => ({
      channelData,
      composite,
      channelsLoading: rawLoading || compositeLoading,
      ijsImage,
      setIjsImage,
    }),
    [channelData, composite, rawLoading, compositeLoading, ijsImage],
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
