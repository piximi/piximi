import { useCallback, useRef, useState } from "react";

import { useDispatch } from "react-redux";

import { useBackend } from "core/backend";
import {
  inferMimeType,
  isTiffFile,
} from "core/file-io/file-loader/fileInputUtils";
import { prepareTiffConfigs } from "core/file-io/file-loader/readers/TiffReader";

import { applicationSettingsSlice } from "store/applicationSettings";

import { AlertType } from "utils/enums";

import type { UploadFile } from "core/backend";
import type {
  TiffAnalysisResult,
  TiffDialogCallbackResult,
} from "core/file-io/file-loader/types";

import type { AlertState } from "utils/types";

type UseFileLoaderReturn = {
  upload: (files: File[]) => Promise<void>;
  isUploading: boolean;
  tiffDialogOpen: boolean;
  pendingTiffAnalysis: TiffAnalysisResult[] | null;
  handleConfirmTiffConfig: (config: TiffDialogCallbackResult) => void;
  handleCancelTiffConfig: () => void;
};

/*
 * Hands image files to the backend. TIFFs are looked at first, here in the
 * browser: their metadata says how the frames map to channels, slices and
 * time, and where it does not, a dialog asks. The config travels with each
 * file; the backend decodes, stores and announces the images, and its
 * `ingest` job is what the task toast shows.
 */
export function useFileLoader(): UseFileLoaderReturn {
  const dispatch = useDispatch();
  const backend = useBackend();
  const [isUploading, setIsUploading] = useState(false);
  const [tiffDialogOpen, setTiffDialogOpen] = useState(false);
  const [pendingTiffAnalysis, setPendingTiffAnalysis] = useState<
    TiffAnalysisResult[] | null
  >(null);
  const tiffResolverRef = useRef<
    ((config: TiffDialogCallbackResult | null) => void) | null
  >(null);

  const handleConfirmTiffConfig = useCallback(
    (config: TiffDialogCallbackResult) => {
      tiffResolverRef.current?.(config);
      setTiffDialogOpen(false);
      setPendingTiffAnalysis(null);
    },
    [],
  );
  const handleCancelTiffConfig = useCallback(() => {
    tiffResolverRef.current?.(null);
    setTiffDialogOpen(false);
    setPendingTiffAnalysis(null);
  }, []);

  const upload = useCallback(
    async (files: File[]): Promise<void> => {
      const ingest = backend.ingest;
      if (!ingest || files.length === 0) return;
      setIsUploading(true);
      try {
        const tiffs = files.filter((file) => isTiffFile(file.name));
        let prepared: Awaited<ReturnType<typeof prepareTiffConfigs>> = null;
        if (tiffs.length > 0) {
          prepared = await prepareTiffConfigs(
            tiffs,
            () => {},
            (analysis) =>
              new Promise((resolve) => {
                setPendingTiffAnalysis(analysis);
                tiffResolverRef.current = resolve;
                setTiffDialogOpen(true);
              }),
          );
          // The dialog was dismissed: nothing is sent.
          if (prepared === null) return;
        }
        const uploads: UploadFile[] = files.map((file) => {
          const config = prepared?.configs.get(file.name);
          return {
            name: file.name,
            // Analysed TIFFs were read already; send those bytes.
            data: prepared?.buffers.get(file.name) ?? file,
            mimeType: inferMimeType(file.name, file.type),
            dimensionConfig: config && {
              dimensionOrder: config.dimensionOrder,
              channels: config.channels,
              slices: config.slices,
              frames: config.frames,
            },
          };
        });
        await ingest.upload(uploads);
      } catch (err) {
        const warning: AlertState = {
          alertType: AlertType.Warning,
          name: "Could not add images",
          description: err instanceof Error ? err.message : String(err),
        };
        dispatch(
          applicationSettingsSlice.actions.updateAlertState({
            alertState: warning,
          }),
        );
      } finally {
        setIsUploading(false);
      }
    },
    [backend, dispatch],
  );

  return {
    upload,
    isUploading,
    tiffDialogOpen,
    pendingTiffAnalysis,
    handleConfirmTiffConfig,
    handleCancelTiffConfig,
  };
}
