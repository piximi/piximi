import {
  createContext,
  FormEvent,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import IJSImage, { Stack as IJSStack } from "image-js";
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
import { selectUnknownImageCategory } from "store/data/selectors";
import { projectSlice } from "store/project";
import {
  selectActiveKindId,
  selectHighlightedCategory,
  selectProjectImageChannels,
} from "store/project/selectors";

import {
  decodeDicomImage,
  forceStack,
  getImageInformation,
} from "utils/file-io/utils";
import { isEnumValue, updateRecordArray } from "utils/objectUtils";
import { convertToImage } from "utils/tensorUtils";
import { isUnknownCategory } from "store/data/utils";

import { MIMETYPES } from "utils/file-io/enums";
import { ImageShapeEnum } from "utils/file-io/enums";
import { AlertType } from "utils/enums";
import { Partition } from "utils/models/enums";

import { ImageObject } from "store/data/types";
import {
  ImageFileShapeInfo,
  ImageShapeInfo,
  MIMEType,
} from "utils/file-io/types";

type ImageShapeInfoImage = ImageFileShapeInfo & {
  fileName: string;
  image?: IJSStack;
  error?: string;
};

const FileUploadContext = createContext<
  ((files: FileList) => Promise<void>) | null
>(null);

const minChannels = 1;

const getUploadedFileTypes = async (files: FileList) => {
  const images: Record<number, Array<ImageShapeInfoImage>> = {};
  for (const file of files) {
    const ext = file.type as MIMEType;
    try {
      // https://stackoverflow.com/questions/56565528/typescript-const-assertions-how-to-use-array-prototype-includes
      if (!isEnumValue(MIMETYPES, file.type)) {
        import.meta.env.NODE_ENV !== "production" &&
          console.error("Invalid MIME Type:", ext);
        updateRecordArray(images, ImageShapeEnum.InvalidImage, {
          shape: ImageShapeEnum.InvalidImage,
          fileName: file.name,
          ext,
          error: `Invalid MIME Type: ${ext}`,
        });
      }

      if (
        file.name.endsWith("dcm") ||
        file.name.endsWith("DICOM") ||
        file.name.endsWith("DCM")
      ) {
        const image = await decodeDicomImage(file);

        updateRecordArray(images, ImageShapeEnum.DicomImage, {
          shape: ImageShapeEnum.DicomImage,
          components: image.length,
          fileName: file.name,
          ext: MIMETYPES.DICOM,
          image,
        });
      } else {
        const buffer = await file.arrayBuffer();
        const image: IJSImage | IJSStack = await IJSImage.load(buffer, {
          ignorePalette: true,
        });

        const imageInfo = getImageInformation(image);

        const imageStack = await forceStack(image);

        updateRecordArray(images, imageInfo.shape, {
          ...imageInfo,
          ext,
          image: imageStack,
          fileName: file.name,
        });
      }
    } catch (err) {
      const error = err as Error;
      updateRecordArray(images, ImageShapeEnum.InvalidImage, {
        shape: ImageShapeEnum.InvalidImage,
        fileName: file.name,
        ext,
        error: `Could not parse image file. -- ${error.message}`,
      });
    }
  }
  return images;
};

export function FileUploadProvider({ children }: { children: ReactNode }) {
  const dispatch = useDispatch();
  const kind = useSelector(selectActiveKindId);
  const projectChannels = useSelector(selectProjectImageChannels);
  const selectedCategory = useSelector(selectHighlightedCategory);
  const unknownCategory = useSelector(selectUnknownImageCategory);

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
      console.log(uploadedFiles);

      const convertedImages: ImageObject[] = [];
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
          const imageToUpload = await convertToImage(
            fileInfo.image!,
            fileInfo.fileName,
            undefined,
            fileInfo.components! / numChannels!,
            numChannels!,
          );
          imageToUpload.categoryId = selectedCategory ?? unknownCategory;
          imageToUpload.partition =
            !selectedCategory ||
            (selectedCategory && isUnknownCategory(selectedCategory))
              ? Partition.Inference
              : Partition.Unassigned;
          imageToUpload.kind = kind;

          convertedImages.push(imageToUpload);
        } catch (err) {
          const error = err as Error;
          errors.push(
            `Error converting ${fileInfo.fileName}: ${error.message}`,
          );
        }
      }
      if (convertedImages.length > 0) {
        const tsConversion = convertedImages.map((im) => {
          return {
            id: im.id,
            name: im.name,
            kind: im.kind,
            bitDepth: im.bitDepth,
            containing: im.containing,
            partition: im.partition,
            shape: im.shape,
            timepoints: {
              0: {
                colors: im.colors,
                src: im.src,
                data: im.data,
                categoryId: im.categoryId,
                activePlane: im.activePlane,
              },
            },
          };
        });
        dispatch(
          dataSlice.actions.addThings({
            things: convertedImages,
          }),
        );
        dispatch(
          dataSlice.actions.addTSImage({
            images: tsConversion,
          }),
        );
        dispatch(
          projectSlice.actions.selectThings({
            ids: convertedImages.map((im) => im.id),
          }),
        );
      }
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
      setNumChannels(channels);
      setStartUpload(true);
    },
    [dispatch],
  );
  const uploadFiles = useCallback(
    async (files: FileList) => {
      setChannelOptions(undefined);

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
