import {
  AnnotationObject,
  DecodedAnnotationObject,
  DecodedTSAnnotationObject,
  TSAnnotationObject,
} from "store/data/types";

/**
 * Decode a Run-length encoded input array.
 * @param encoded Run-length encoded input array
 * @returns The decoded input array
 */
export const decode = (encoded: Array<number>): Uint8ClampedArray => {
  const decoded = [];

  let background = true;

  for (let i = 0; i < encoded.length; i++) {
    for (let j = 0; j < encoded[i]; j++) {
      decoded.push(background ? 0 : 255);
    }

    background = !background;
  }

  return new Uint8ClampedArray(decoded);
};

export const decodeAnnotation = (
  encodedAnnotation: AnnotationObject | TSAnnotationObject,
): DecodedAnnotationObject | DecodedTSAnnotationObject => {
  if (encodedAnnotation.decodedMask)
    return encodedAnnotation as DecodedAnnotationObject;
  // TODO - serializtion: temporary measure, remove when done
  if (!encodedAnnotation.encodedMask)
    throw Error(`Annotation ${encodedAnnotation.id} has no encoded mask`);

  const decodedAnnotation = {
    ...encodedAnnotation,
    decodedMask: Uint8Array.from(decode(encodedAnnotation.encodedMask)),
  };

  return decodedAnnotation;
};

/**
 * Compute the Run-length encoding of the input array.
 * @param decoded (decoded) input array
 * @param expectBinary true if decoded mask is binary array (only consists of the values 0 or 1)
                       false if the two values are 0 and 26^bitDepth-1
 * @returns Encoded array
 */
export const encode = (
  decoded: Uint8Array | Uint8ClampedArray | Uint16Array | Float32Array,
  expectBinary: boolean = false,
): Array<number> => {
  let highVal: number;

  if (expectBinary) {
    highVal = 1;
  } else {
    const bitDepth =
      decoded.constructor === Uint16Array
        ? 16
        : decoded.constructor === Float32Array
          ? 32
          : 8; // Uint8[Clamped]Array

    highVal = 2 ** bitDepth - 1;
  }

  let lastElement = decoded[0];

  let lastSequenceSize = 1;

  const encoded = [];

  // Float32Array data usually holds normalized data between 0 and 1,
  // in which case it must be denormalized before calling this func
  // such that 0 -> 0 and 1 -> 2*16-1
  // or expectBinary should be set true
  if (decoded[0] === highVal) {
    encoded.push(0);
  }

  for (let i = 1; i < decoded.length; i++) {
    if (lastElement !== decoded[i]) {
      encoded.push(lastSequenceSize);

      lastElement = decoded[i];

      lastSequenceSize = 1;
    } else {
      lastSequenceSize += 1;
    }
  }

  encoded.push(lastSequenceSize);

  return encoded;
};

export const encodeAnnotation = (
  decodedAnnotation: DecodedAnnotationObject,
): AnnotationObject => {
  // TODO - serializtion: temporary measure, remove when done
  if (!decodedAnnotation.decodedMask)
    throw Error(`Annotation ${decodedAnnotation.id} has no decoded mask`);

  const encodedAnnotation = {
    ...decodedAnnotation,
    encodedMask: encode(decodedAnnotation.decodedMask),
  };

  return encodedAnnotation;
};
