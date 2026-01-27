import {
  createContext,
  FormEvent,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  FormControl,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
} from "@mui/material";

import { ConfirmationDialog } from "components/dialogs/ConfirmationDialog";

import { applicationSettingsSlice } from "store/applicationSettings";
import { dataSlice } from "store/data";
import { IMAGE_KIND } from "store/data/constants";
import { selectUnknownImageCategory } from "store/data/selectors";
import { ImageObject, ImageMetadata } from "store/data/types";
import { generateUUID, isUnknownCategory } from "store/data/utils";
import { projectSlice } from "store/project";
import {
  selectActiveKindId,
  selectActiveCategory,
  selectProjectImageChannels,
} from "store/project/selectors";

import { ImageShapeInfo, ImageShapeInfoImage } from "utils/file-io/types";
import { ImageShapeEnum } from "utils/file-io/enums";
import { getUploadedFileTypes } from "utils/file-io/utils";
import { AlertType } from "utils/enums";
import { Partition } from "utils/models/enums";
import { arrayRange } from "utils/arrayUtils";
import { extractImageFileDetails } from "utils/tensorUtils";

const FileUploadContext = createContext<
  | ((
      files: FileList,
      options?: { timeSeriesDelimeter: string },
    ) => Promise<void>)
  | null
>(null);

const minChannels = 1;

export function FileUploadProvider({ children }: { children: ReactNode }) {
  const dispatch = useDispatch();
  const kind = useSelector(selectActiveKindId);
  const projectChannels = useSelector(selectProjectImageChannels);
  const selectedCategory = useSelector(selectActiveCategory);
  const unknownCategory = useSelector(selectUnknownImageCategory);
  const [timeSeries, setTimeSeries] = useState<boolean>(false);

  const [fileInfo, setFileInfo] = useState<
    Record<number, ImageShapeInfoImage[]>
  >({});
  const [openDimensionsDialogBox, setOpenDimensionsDialogBox] = useState(false);
  const [channelOptions, setChannelOptions] = useState<number[]>();
  const [numChannels, setNumChannels] = useState<number | undefined>(
    projectChannels,
  );
  const [uploadPromptMessage, setUploadPromptMessage] = useState<string>("");

  const [startUpload, setStartUpload] = useState<boolean>(false);
  const [referenceHyperStack, setReferenceHyperStack] =
    useState<ImageShapeInfoImage>();

  const uploadImages = useCallback(
    async (errors: string[]) => {
      delete fileInfo[ImageShapeEnum.InvalidImage];
      const uploadedFiles = Object.values(fileInfo).flat();

      const generatedMetadataObjects: {
        metadata: ImageMetadata;
        images: ImageObject[];
      }[] = [];
      let i = 0;
      for await (const fileInfo of uploadedFiles) {
        if (
          fileInfo.ext !== "image/dicom" &&
          fileInfo.components! !== numChannels &&
          fileInfo.components! <= 3
        ) {
          errors.push(
            `${
              fileInfo.fileName
            } -- All images in project must be ${numChannels}-channel, recieved ${fileInfo.components!}-channel image.`,
          );
          continue;
        }
        if (!fileInfo.image) {
          continue;
        }
        if (
          !(
            fileInfo.image![0].bitDepth === 8 ||
            fileInfo.image![0].bitDepth === 16
          )
        ) {
          errors.push(
            `${fileInfo.fileName} -- Unsupported bit depth of ${
              fileInfo.image![0].bitDepth
            }`,
          );

          continue;
        }
        try {
          const { shape, bitDepth, ...extractedImageData } =
            await extractImageFileDetails(
              fileInfo.image!,
              fileInfo.fileName,
              undefined,
              fileInfo.components! / numChannels!,
              numChannels!,
            );
          const metadata: ImageMetadata = {
            name: fileInfo.fileName,
            id: generateUUID(),
            kind: IMAGE_KIND,
            shape,
            bitDepth,
            imageDataIds: [extractedImageData.id],
            defaultImageId: extractedImageData.id,
            timeSeries,
          };
          const generatedImageObject: ImageObject = {
            ...extractedImageData,
            metadataId:
              !timeSeries || i === 0
                ? metadata.id
                : generatedMetadataObjects[0].metadata.id,
            name: fileInfo.fileName + `_data_${timeSeries ? i : 0}`,
            partition:
              !selectedCategory ||
              (selectedCategory && isUnknownCategory(selectedCategory))
                ? Partition.Inference
                : Partition.Unassigned,
            categoryId: selectedCategory ?? unknownCategory,
            activePlane: 0,
            timepoint: timeSeries ? i : undefined,
          };
          if (!timeSeries || i === 0) {
            generatedMetadataObjects.push({
              metadata,
              images: [generatedImageObject],
            });
          }
          if (timeSeries && i > 0) {
            generatedMetadataObjects[0].metadata.imageDataIds.push(
              generatedImageObject.id,
            );
            generatedMetadataObjects[0].images.push(generatedImageObject);
          }
        } catch (err) {
          const error = err as Error;
          errors.push(
            `Error converting ${fileInfo.fileName}: ${error.message}`,
          );
        }
        i++;
      }
      dispatch(dataSlice.actions.batchAddMetadata(generatedMetadataObjects));
      if (errors.length > 0) {
        dispatch(
          applicationSettingsSlice.actions.updateAlertState({
            alertState: {
              alertType: AlertType.Error,
              name: "File Upload Error",
              description: [...errors].join("\n---\n"),
            },
          }),
        );
      }
    },
    [dispatch, fileInfo, kind, numChannels, selectedCategory, unknownCategory],
  );

  const updateChannels = useCallback(
    (channels: number) => {
      dispatch(projectSlice.actions.setProjectImageChannels({ channels }));
      //TODO Include info from metadata when accessible
      dispatch(
        projectSlice.actions.setProjectChannels(
          arrayRange(channels).map((index) => `Channel ${index + 1}`),
        ),
      );
      setNumChannels(channels);
      setStartUpload(true);
    },
    [dispatch],
  );
  const uploadFiles = useCallback(
    async (files: FileList, options?: { timeSeriesDelimeter: string }) => {
      setChannelOptions(undefined);
      if (options) {
        setTimeSeries(true);
      }
      const imageInfo = await getUploadedFileTypes(files);

      setFileInfo(imageInfo);
      if (!numChannels) {
        if (
          (ImageShapeEnum.DicomImage in imageInfo ||
            ImageShapeEnum.GreyScale in imageInfo) &&
          ImageShapeEnum.SingleRGBImage in imageInfo
        ) {
          setUploadPromptMessage(
            "Your files contain both 3-channel and greyscale images, but channels across images must be uniform. Which would you like to use?",
          );
          setChannelOptions([
            imageInfo[ImageShapeEnum.GreyScale][0].components!,
            imageInfo[ImageShapeEnum.SingleRGBImage][0].components!,
          ]);
          setOpenDimensionsDialogBox(true);
        } else if (ImageShapeEnum.GreyScale in imageInfo) {
          updateChannels(imageInfo![ImageShapeEnum.GreyScale]![0].components!);
        } else if (ImageShapeEnum.DicomImage in imageInfo) {
          updateChannels(1);
        } else if (ImageShapeEnum.SingleRGBImage in imageInfo) {
          updateChannels(
            imageInfo[ImageShapeEnum.SingleRGBImage][0].components!,
          );
        } else if (ImageShapeEnum.HyperStackImage in imageInfo) {
          setUploadPromptMessage(
            "How many channels do your images consist of?",
          );
          setReferenceHyperStack(imageInfo[ImageShapeEnum.HyperStackImage][0]);
          setOpenDimensionsDialogBox(true);
        } else if (ImageShapeEnum.InvalidImage in imageInfo) {
          const errors = imageInfo[ImageShapeEnum.InvalidImage].map(
            (info) => `${info.fileName} -- ${info.error}`,
          );

          if (errors.length > 0) {
            dispatch(
              applicationSettingsSlice.actions.updateAlertState({
                alertState: {
                  alertType: AlertType.Error,
                  name: "File Upload Error",
                  description: [...errors].join("\n---\n"),
                },
              }),
            );
          }
        }
      } else {
        setStartUpload(true);
      }
    },
    [dispatch, numChannels, updateChannels],
  );

  const handleCloseDimensionsDialog = () => {
    setUploadPromptMessage("");
    setOpenDimensionsDialogBox(false);
    setChannelOptions(undefined);
  };

  useEffect(() => {
    const errors: string[] = [];
    if (fileInfo[ImageShapeEnum.InvalidImage]) {
      errors.push(
        ...fileInfo[ImageShapeEnum.InvalidImage].map(
          (info) => `${info.fileName} -- ${info.error}`,
        ),
      );
    }

    if (startUpload) {
      uploadImages(errors);
      setStartUpload(false);
    }
  }, [startUpload, fileInfo, uploadImages]);

  useEffect(() => {
    setNumChannels(projectChannels);
  }, [projectChannels]);

  return (
    <>
      <FileUploadContext.Provider value={uploadFiles}>
        {children}
        {openDimensionsDialogBox && (
          <ImageShapeDialog
            channelOptions={channelOptions}
            promptMessage={uploadPromptMessage}
            referenceHyperStack={referenceHyperStack}
            open={openDimensionsDialogBox}
            onClose={handleCloseDimensionsDialog}
            onConfirm={updateChannels}
          />
        )}
      </FileUploadContext.Provider>
    </>
  );
}

type ImageShapeDialogProps = {
  channelOptions?: number[];
  promptMessage: string;
  referenceHyperStack?: ImageShapeInfoImage;
  open: boolean;
  onClose: () => void;
  onConfirm: (channels: number) => void;
  referenceImageShape?: ImageShapeInfo;
};

const ImageShapeDialog = ({
  channelOptions,
  promptMessage,
  referenceHyperStack,
  open,
  onConfirm,
  onClose,
}: ImageShapeDialogProps) => {
  const [channels, setChannels] = useState<number>(
    channelOptions ? channelOptions[0] : 1,
  );
  const [channelsString, setChannelsString] = useState<string>(
    channels.toString(),
  );
  const [frames, setFrames] = useState<number>(-1);

  const [invalidImageShape, setInvalidImageShape] = useState<boolean>(false);

  const [errorHelpText, setErrorHelpText] = useState<string>(" ");

  const handleSelectChange = (event: SelectChangeEvent) => {
    setChannels(+event.target.value);
  };

  const onTextFieldChange = (event: FormEvent<EventTarget>) => {
    const target = event.target as HTMLInputElement;
    const inputString = target.value;
    setChannelsString(inputString);
    const _channels = Number(inputString);
    if (target.value === "" || isNaN(_channels) || _channels < minChannels) {
      setErrorHelpText(`Must be an integer greater than 0`);
      setInvalidImageShape(true);
      return;
    }

    if (referenceHyperStack) {
      const slices = referenceHyperStack!.components! / _channels;
      if (!Number.isInteger(slices)) {
        setErrorHelpText(
          `Invalid Image Shape: Cannot create a ${_channels} (c) x ${(
            frames / _channels
          ).toFixed(2)} (z) image from file.`,
        );
        setInvalidImageShape(true);
        return;
      }
      setInvalidImageShape(false);
    }

    setErrorHelpText(" ");
    setInvalidImageShape(false);
    setChannels(_channels);
  };

  useEffect(() => {
    setChannelsString(channels.toString());
  }, [channels]);

  useEffect(() => {
    if (referenceHyperStack) {
      const imageFrames = referenceHyperStack.components!;
      setFrames(imageFrames);
    }
  }, [referenceHyperStack]);

  return (
    <ConfirmationDialog
      title={"Select Channels"}
      isOpen={open}
      content={
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <Typography>{promptMessage}</Typography>
          {channelOptions ? (
            <Box sx={{ pt: 1 }}>
              <FormControl size="small" sx={{ width: "15ch" }}>
                <Select value={"" + channels} onChange={handleSelectChange}>
                  {channelOptions.map((channel) => {
                    return (
                      <MenuItem key={`channel-${channel}`} value={channel}>
                        {channel}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Box>
          ) : (
            <Box>
              <FormControl size="small" sx={{ width: "15ch" }}>
                <TextField
                  id="channels-c"
                  label="Channels"
                  error={invalidImageShape}
                  value={channelsString}
                  onChange={onTextFieldChange}
                  variant="standard"
                  type="text"
                  margin="normal"
                  autoComplete="off"
                  size="small"
                />
              </FormControl>
              <Box position="absolute">
                {invalidImageShape && (
                  <Typography
                    variant="body2"
                    sx={(theme) => ({ color: theme.palette.error.main })}
                  >
                    {errorHelpText}
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </Box>
      }
      onConfirm={() => {
        onConfirm(channels);
      }}
      onClose={() => {
        onClose();
      }}
    />
  );
};

export function useFileUploadContext() {
  return useContext(FileUploadContext);
}
