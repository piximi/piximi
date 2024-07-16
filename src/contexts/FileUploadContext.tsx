import * as ImageJS from "image-js";
//import * as DicomParser from "dicom-parser";
import {
  createContext,
  FormEvent,
  ReactElement,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import CloseIcon from "@mui/icons-material/Close";
import { useDispatch, useSelector } from "react-redux";
import { applicationSettingsSlice } from "store/applicationSettings";
import { dataSlice } from "store/data";

import { selectUnknownImageCategory } from "store/data/selectors";
import { MIMETYPES } from "utils/file-io/constants";
import { ImageShapeEnum } from "utils/file-io/enums";
import {
  decodeDicomImage,
  forceStack,
  getImageInformation,
} from "utils/file-io/helpers";
import {
  ImageFileShapeInfo,
  ImageShapeInfo,
  MIMEType,
} from "utils/file-io/types";
import { updateRecord } from "utils/common/helpers";
import { useHotkeys } from "hooks";
import { AlertType, HotkeyView } from "utils/common/enums";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogProps,
  DialogTitle,
  FormControl,
  IconButton,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
} from "@mui/material";
import { convertToImage } from "utils/common/tensorHelpers";
import { ImageObject } from "store/data/types";
import {
  selectActiveKindId,
  selectHighlightedCategory,
  selectProjectImageChannels,
} from "store/project/selectors";
import { projectSlice } from "store/project";

type ImageShapeInfoImage = ImageFileShapeInfo & {
  fileName: string;
  image?: ImageJS.Stack;
  error?: string;
};

const FileUploadContext = createContext<
  ((files: FileList) => Promise<void>) | null
>(null);

const minChannels = 1;
const maxChannels = 5;

const getUploadedFileTypes = async (files: FileList) => {
  const images: Record<number, Array<ImageShapeInfoImage>> = {};
  for (const file of files) {
    const ext = file.type as MIMEType;
    try {
      // https://stackoverflow.com/questions/56565528/typescript-const-assertions-how-to-use-array-prototype-includes
      if (!(MIMETYPES as ReadonlyArray<string>).includes(file.type)) {
        process.env.NODE_ENV !== "production" &&
          console.error("Invalid MIME Type:", ext);
        updateRecord(images, ImageShapeEnum.InvalidImage, {
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

        updateRecord(images, ImageShapeEnum.DicomImage, {
          shape: ImageShapeEnum.DicomImage,
          components: image.length,
          fileName: file.name,
          ext: "image/dicom",
          image,
        });
      } else {
        const buffer = await file.arrayBuffer();
        const image: ImageJS.Image | ImageJS.Stack = await ImageJS.Image.load(
          buffer,
          {
            ignorePalette: true,
          }
        );

        const imageInfo = getImageInformation(image);

        const imageStack = await forceStack(image);

        updateRecord(images, imageInfo.shape, {
          ...imageInfo,
          ext,
          image: imageStack,
          fileName: file.name,
        });
      }
    } catch (err) {
      const error = err as Error;
      updateRecord(images, ImageShapeEnum.InvalidImage, {
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
    projectChannels
  );
  const [uploadPromptMessage, setUploadPromptMessage] = useState<string>("");

  const [startUpload, setStartUpload] = useState<boolean>(false);
  const [referenceHyperStack, setReferenceHyperStack] =
    useState<ImageShapeInfoImage>();

  const uploadFiles = async (files: FileList) => {
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
          "Your files contain both 3-channel and greyscale images, but channels across images must be uniform. Which would you like to use?"
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
        updateChannels(imageInfo[ImageShapeEnum.SingleRGBImage][0].components!);
      } else if (ImageShapeEnum.HyperStackImage in imageInfo) {
        setUploadPromptMessage("How many channels do your images consist of?");
        setReferenceHyperStack(imageInfo[ImageShapeEnum.HyperStackImage][0]);
        setOpenDimensionsDialogBox(true);
      } else if (ImageShapeEnum.InvalidImage in imageInfo) {
        const errors = imageInfo[ImageShapeEnum.InvalidImage].map(
          (info) => `${info.fileName} -- ${info.error}`
        );

        if (errors.length > 0) {
          dispatch(
            applicationSettingsSlice.actions.updateAlertState({
              alertState: {
                alertType: AlertType.Error,
                name: "File Upload Error",
                description: [...errors].join("\n---\n"),
              },
            })
          );
        }
      }
    } else {
      setStartUpload(true);
    }
  };

  const handleCloseDimensionsDialog = () => {
    setUploadPromptMessage("");
    setOpenDimensionsDialogBox(false);
  };
  const cancelChannelUpdate = () => {
    setNumChannels(undefined);
    setChannelOptions(undefined);

    setFileInfo({});
  };

  const updateChannels = (channels: number) => {
    dispatch(projectSlice.actions.setProjectImageChannels({ channels }));
    setNumChannels(channels);
    setStartUpload(true);
  };

  useEffect(() => {
    const errors: string[] = [];
    if (fileInfo[ImageShapeEnum.InvalidImage]) {
      errors.push(
        ...fileInfo[ImageShapeEnum.InvalidImage].map(
          (info) => `${info.fileName} -- ${info.error}`
        )
      );
    }

    const uploadImages = async () => {
      delete fileInfo[ImageShapeEnum.InvalidImage];
      const uploadedFiles = Object.values(fileInfo).flat();

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
            } -- All images in project must be ${numChannels}-channel, recieved ${fileInfo.components!}-channel image.`
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
            }`
          );

          continue;
        }
        try {
          const imageToUpload = await convertToImage(
            fileInfo.image!,
            fileInfo.fileName,
            undefined,
            fileInfo.components! / numChannels!,
            numChannels!
          );
          imageToUpload.categoryId = selectedCategory ?? unknownCategory;
          imageToUpload.kind = kind;

          convertedImages.push(imageToUpload);
        } catch (err) {
          const error = err as Error;
          errors.push(
            `Error converting ${fileInfo.fileName}: ${error.message}`
          );
        }
      }
      if (convertedImages.length > 0) {
        dispatch(
          dataSlice.actions.addThings({
            things: convertedImages,
            isPermanent: true,
          })
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
          })
        );
      }
    };
    if (startUpload) {
      uploadImages();
      setStartUpload(false);
    }
  }, [
    startUpload,
    dispatch,
    fileInfo,
    selectedCategory,
    unknownCategory,
    numChannels,
    kind,
  ]);

  useEffect(() => {
    setNumChannels(projectChannels);
  }, [projectChannels]);

  return (
    <>
      <FileUploadContext.Provider value={uploadFiles}>
        {children}
        <ImageShapeDialog
          channelOptions={channelOptions}
          fileInfo={fileInfo!}
          promptMessage={uploadPromptMessage}
          referenceHyperStack={referenceHyperStack}
          open={openDimensionsDialogBox}
          onClose={handleCloseDimensionsDialog}
          onConfirm={updateChannels}
          onReject={cancelChannelUpdate}
        />
      </FileUploadContext.Provider>
    </>
  );
}

export function useFileUpload() {
  return useContext(FileUploadContext);
}

type ImageShapeDialogProps = {
  channelOptions?: number[];
  promptMessage: string;
  fileInfo: Record<number, ImageShapeInfoImage[]>;
  referenceHyperStack?: ImageShapeInfoImage;
  open: boolean;
  onClose: () => void;
  onConfirm: (channels: number) => void;
  onReject: () => void;
  referenceImageShape?: ImageShapeInfo;
};

export const ImageShapeDialog = ({
  channelOptions,
  promptMessage,
  fileInfo,
  referenceHyperStack,
  open,
  onConfirm,
  onReject,
  onClose,
}: ImageShapeDialogProps) => {
  const [channels, setChannels] = useState<number>(
    channelOptions ? channelOptions[0] : 1
  );
  const [channelsString, setChannelsString] = useState<string>(
    channels.toString()
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
    if (
      target.value === "" ||
      isNaN(_channels) ||
      _channels < minChannels ||
      _channels > maxChannels
    ) {
      setErrorHelpText(
        `Must be an integer between ${minChannels} and ${maxChannels}`
      );
      setInvalidImageShape(true);
      return;
    }

    if (referenceHyperStack) {
      const slices = referenceHyperStack!.components! / _channels;
      if (!Number.isInteger(slices)) {
        setErrorHelpText(
          `Invalid Image Shape: Cannot create a ${_channels} (c) x ${(
            frames / _channels
          ).toFixed(2)} (z) image from file.`
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
    <DialogWithAction
      title={"Select Channels"}
      isOpen={open}
      content={
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <Typography>{promptMessage}</Typography>
          {channelOptions ? (
            <Select value={"" + channels} onChange={handleSelectChange}>
              {channelOptions.map((channel) => {
                return (
                  <MenuItem key={`channel-${channel}`} value={channel}>
                    {channel}
                  </MenuItem>
                );
              })}
            </Select>
          ) : (
            <Box sx={{ pt: 0, pb: 0 }}>
              <FormControl size="small" sx={{ width: "15ch", py: "20px" }}>
                <TextField
                  id="channels-c"
                  label="Channels"
                  error={invalidImageShape}
                  value={channelsString}
                  onChange={onTextFieldChange}
                  type="text"
                  margin="normal"
                  autoComplete="off"
                  size="small"
                />
              </FormControl>
              <Box
                width="100%"
                display="flex"
                justifyContent="center"
                height="2em"
                alignContent="center"
              >
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
      confirmAndClose={() => {
        onConfirm(channels);
        onClose();
      }}
      onClose={() => {
        onReject();
        onClose();
      }}
    />
  );
};

type DialogWithActionProps = Omit<
  DialogProps,
  "children" | "open" | "content"
> & {
  title: string;
  content?: ReactElement | string;
  confirmAndClose: () => void;
  rejectAndClose?: () => void;
  onClose: () => void;
  isOpen: boolean;
  confirmText?: string;
  rejectText?: string;
  confirmDisabled?: boolean;
};

export const DialogWithAction = ({
  title,
  content,
  confirmAndClose,
  rejectAndClose,
  onClose,
  confirmText = "Confirm",
  rejectText = "Reject",
  isOpen,
  confirmDisabled,
  ...rest
}: DialogWithActionProps) => {
  useHotkeys(
    "enter",
    () => {
      confirmAndClose();
    },
    HotkeyView.DialogWithAction,
    { enableOnTags: ["INPUT"], enabled: isOpen },
    [confirmAndClose]
  );

  return (
    <Dialog fullWidth onClose={onClose} open={isOpen} {...rest}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        px={1}
        pb={1.5}
        pt={1}
      >
        <DialogTitle sx={{ p: 1 }}>{title}</DialogTitle>
        <IconButton
          onClick={onClose}
          sx={(theme) => ({
            maxHeight: "40px",
          })}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      {content && <DialogContent sx={{ pb: 0 }}>{content}</DialogContent>}

      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        {rejectAndClose ? (
          <Button onClick={rejectAndClose} color="primary">
            {rejectText}
          </Button>
        ) : (
          <></>
        )}
        <Button
          onClick={confirmAndClose}
          color="primary"
          disabled={confirmDisabled}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const intRegExpr = new RegExp("^[0-9]+(.0*)?$");
const floatRegExpr = new RegExp("-*^[0-9]*(.[0-9]*)?$");

type CustomNumberTextFieldProps = {
  id: string;
  label: string;
  value: number;
  dispatchCallBack: (input: number) => void;
  errorChecker?: (value: string) => { isError: boolean; message: string };
  min?: number;
  max?: number;
  enableFloat?: boolean;
  disabled?: boolean;
  size?: "small" | "medium";
  width?: string;
};

export const CustomNumberTextField = ({
  id,
  label,
  value,
  dispatchCallBack,
  errorChecker,
  min = Number.MIN_SAFE_INTEGER,
  max = Number.MAX_SAFE_INTEGER,
  enableFloat = false,
  disabled = false,
  size = "small",
  width,
}: CustomNumberTextFieldProps) => {
  const [valueString, setValueString] = useState<string>(value.toString());

  useEffect(() => {
    setValueString(value.toString());
  }, [value]);

  const [inputValue, setInputValue] = useState<number>(value);

  const [inputError, setInputError] = useState<boolean>(false);

  const [errorHelpText, setErrorHelpText] = useState<string>(" ");

  const regExp = enableFloat ? floatRegExpr : intRegExpr;

  const rangeHelperText = useMemo(() => {
    if (min !== Number.MIN_SAFE_INTEGER && max !== Number.MAX_SAFE_INTEGER) {
      return ` between ${min} and ${max}`;
    } else if (min !== Number.MIN_SAFE_INTEGER) {
      return ` ${min} or above`;
    } else if (max !== Number.MAX_SAFE_INTEGER) {
      return ` ${max} or below`;
    }
    return "";
  }, [max, min]);

  const onInputChange = (event: FormEvent<EventTarget>) => {
    const target = event.target as HTMLInputElement;
    const inputString = target.value;

    setValueString(inputString);

    if (!regExp.test(target.value) || target.value === "") {
      setErrorHelpText(
        `Must be a${
          enableFloat ? " floating point" : "n integer"
        } ${rangeHelperText}`
      );
      setInputError(true);
      return;
    }

    const arg = Number(inputString);

    if (isNaN(arg) || arg < min || arg > max) {
      setErrorHelpText(
        `Must be a${
          enableFloat ? " floating point" : "n integer"
        } value${rangeHelperText}`
      );
      setInputError(true);
      return;
    }

    if (errorChecker) {
      const res = errorChecker(inputString);
      if (res.isError) {
        setInputError(true);
        setErrorHelpText(res.message);
        return;
      }
    }
    setErrorHelpText(" ");
    setInputError(false);
    setInputValue(arg);
  };

  const dispatchValue = () => {
    dispatchCallBack(inputValue);
  };

  return (
    <>
      <FormControl size={size}>
        <TextField
          id={id}
          onBlur={dispatchValue}
          label={label}
          error={inputError}
          value={valueString}
          onChange={onInputChange}
          type="text"
          margin="normal"
          autoComplete="off"
          disabled={disabled}
          size={size}
          sx={{
            width: width ? width : "inherit",
            // "& .MuiFormHelperText-root.Mui-error": {
            //   position: "absolute",
            //   top: "100%",
            // },
          }}
        />
      </FormControl>
      <Box
        width="100%"
        display="flex"
        justifyContent="center"
        height="2em"
        alignContent="center"
      >
        {inputError && (
          <Typography
            variant="body2"
            sx={(theme) => ({ color: theme.palette.error.main })}
          >
            {errorHelpText}
          </Typography>
        )}
      </Box>
    </>
  );
};
