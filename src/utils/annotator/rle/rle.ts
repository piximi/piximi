import { AnnotationType, DecodedAnnotationType } from "types";

/**
 * Decode a Run-length encoded input array.
 * @param encoded Run-length encoded input array
 * @returns The decoded input array
 */
export const decode = (encoded: Array<number>): Uint8ClampedArray => {
  let decoded = [];

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
  encodedAnnotation: AnnotationType
): DecodedAnnotationType => {
  // TODO - serializtion: temporary measure, remove when done
  if (!encodedAnnotation.encodedMask)
    throw Error(`Annotation ${encodedAnnotation.id} has no encoded mask`);

  const decodedAnnotation = {
    ...encodedAnnotation,
    decodedMask: Uint8Array.from(decode(encodedAnnotation.encodedMask)),
  };

  return decodedAnnotation;
};

export const decodeAnnotations = async (
  encodedAnnotations: Array<AnnotationType>
): Promise<Array<DecodedAnnotationType>> => {
  return new Promise((resolve, reject) => {
    const decodedAnnotations = encodedAnnotations.map((annotation) => {
      const decdodedAnnotation = {
        ...annotation,
        decodedMask: Uint8Array.from(decode(annotation.encodedMask)),
      };
      return decdodedAnnotation;
    });

    resolve(decodedAnnotations);
  });
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
  expectBinary: boolean = false
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

  let encoded = [];

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
  decodedAnnotation: DecodedAnnotationType
): AnnotationType => {
  // TODO - serializtion: temporary measure, remove when done
  if (!decodedAnnotation.decodedMask)
    throw Error(`Annotation ${decodedAnnotation.id} has no decoded mask`);

  const encodedAnnotation = {
    ...decodedAnnotation,
    encodedMask: encode(decodedAnnotation.decodedMask),
  };

  return encodedAnnotation;
};

export const encodeAnnotations = (
  decodedAnnotations: Array<DecodedAnnotationType>
): Array<AnnotationType> => {
  const encodedAnnotations = decodedAnnotations.map((annotation) => {
    const decdodedAnnotation = {
      ...annotation,
      encodedMask: encode(annotation.decodedMask),
    };
    return decdodedAnnotation;
  });

  return encodedAnnotations;
};

export const fromString = (s: Array<number>) => {
  let counts = [];
  let m = 0;
  let p = 0;
  let k;
  let x;
  let more;

  while (s[p]) {
    x = 0;
    k = 0;
    more = 1;

    while (more) {
      let c = s[p] - 48;
      x = x | ((c & 0x1f) << (5 * k));
      more = c & 0x20;
      p += 1;
      k += 1;

      if (!more && c & 0x10) {
        x = x | (-1 << (5 * k));
      }
    }

    if (m > 2) {
      x += counts[m - 2];
    }

    counts[m++] = x;
  }

  return counts;
};

export const toImageData = (
  decoded: Uint8ClampedArray,
  width: number,
  height: number
) => {
  let data = [];

  for (let i = 0; i < decoded.length; i++) {
    data.push(...[decoded[i], decoded[i], decoded[i], 255]);
  }

  const clamped = new Uint8ClampedArray(data);

  return new ImageData(clamped, width, height);
};
