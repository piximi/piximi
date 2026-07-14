import type { ReactNode } from "react";
import { createContext, useContext } from "react";

import { useSelector } from "react-redux";

import { useRawImageData } from "hooks/useRawImageData";
import { useRenderedSrc } from "hooks/useRenderedSrcs";

import type { BitDepth } from "store/dataV2/types";
import { selectActiveImageId } from "@ImageViewer/state/image-viewer-data/selectors";
import { useParameterizedSelector } from "store/hooks";
import { selectActiveExtendedChannels } from "store/dataV2/selectors";

export const ActiveImageContext = createContext<{
  channelData: Array<{
    bitDepth: BitDepth;
    data: Uint8Array<ArrayBuffer> | Uint16Array<ArrayBuffer>;
  }>;
  channelsLoading: boolean;
  imageSrc: string;
  srcLoading: boolean;
}>({
  channelData: [],
  channelsLoading: false,
  imageSrc: "",
  srcLoading: false,
});

export const ActiveImageProvider = ({ children }: { children: ReactNode }) => {
  const activeImageId = useSelector(selectActiveImageId);
  const activeChannels = useParameterizedSelector(
    selectActiveExtendedChannels,
    activeImageId ?? "",
  );

  const { channelData, loading: channelsLoading } =
    useRawImageData(activeChannels);
  const { src: imageSrc, loading: srcLoading } = useRenderedSrc(activeChannels);

  return (
    <ActiveImageContext.Provider
      value={{ channelData, channelsLoading, imageSrc, srcLoading }}
    >
      {children}
    </ActiveImageContext.Provider>
  );
};

export const useActiveImage = () => {
  const savedDataState = useContext(ActiveImageContext);

  return savedDataState;
};
