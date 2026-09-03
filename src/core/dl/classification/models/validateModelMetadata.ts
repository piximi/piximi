import { getOrElseW } from "fp-ts/Either";
import { failure } from "io-ts/lib/PathReporter";
import {
  keyof as IOTSKeyof,
  string as IOTSString,
  number as IOTSNumber,
  type as IOTSType,
  array as IOTSArray,
  union as IOTSUnion,
  boolean as IOTSBoolean,
  record as IOTSRecord,
  intersection as iotsIntersection,
  partial as IOTSPartialType,
} from "io-ts";

import { logger } from "utils/logUtils";

import {
  CropSchema,
  LossFunction,
  Metric,
  OptimizationAlgorithm,
} from "../../enums";

import type { KeyofC as IOTSKeyofC } from "io-ts";

const enumToCodec = <E extends Record<string, string>>(
  e: E,
): IOTSKeyofC<Record<E[keyof E], null>> => {
  const values = Object.values(e);
  return IOTSKeyof(
    values.reduce<Record<string, null>>((acc, value) => {
      acc[value] = null;
      return acc;
    }, {}),
  );
};

const SerializedModelMetadataRType = iotsIntersection([
  IOTSType({
    preprocessSettings: iotsIntersection([
      IOTSType({
        cropSchema: enumToCodec(CropSchema),
        numCrops: IOTSNumber,
        inputShape: IOTSType({
          width: IOTSNumber,
          height: IOTSNumber,
          channels: IOTSNumber,
        }),
        shuffle: IOTSBoolean,
        batchSize: IOTSNumber,
      }),
      IOTSUnion([
        IOTSType({ rescale: IOTSBoolean }), // old saves
        IOTSType({ normalize: IOTSBoolean }), // new saves
      ]),
    ]),
    classes: IOTSArray(IOTSString),
    optimizerSettings: IOTSType({
      learningRate: IOTSNumber,
      lossFunction: IOTSUnion([
        enumToCodec(LossFunction),
        IOTSArray(enumToCodec(LossFunction)),
        IOTSRecord(IOTSString, enumToCodec(LossFunction)),
      ]),
      metrics: IOTSArray(enumToCodec(Metric)),
      optimizationAlgorithm: enumToCodec(OptimizationAlgorithm),
      epochs: IOTSNumber,
      batchSize: IOTSNumber,
    }),
  }),
  IOTSPartialType({ modelArch: IOTSNumber }),
]);

const toError = (errors: any) => {
  import.meta.env.NODE_ENV !== "production" && logger(errors);
  throw new Error(failure(errors).join("\n"));
};

export const validateModelMetadata = (encodedFileContents: string) => {
  const metadata = JSON.parse(encodedFileContents);
  return getOrElseW(toError)(SerializedModelMetadataRType.decode(metadata));
};
