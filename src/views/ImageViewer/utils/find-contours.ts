/** Finding contours in binary images and approximating polylines.
 *  Implements the same algorithms as OpenCV's findContours and approxPolyDP.
 *  <p>
 *  Made possible with support from The Frank-Ratchye STUDIO For Creative Inquiry
 *  At Carnegie Mellon University. http://studioforcreativeinquiry.org/
 *  @author Lingdong Huang
 *
 * original source: https://gist.github.com/LingDong-/b99cdbe814e600d8152c0eefeef01ab3
 *
 * Modified for use in piximi 2/23/2023
 * @author Nodari Gogoberidze
 */

import { logger } from "utils/common/helpers";
import { Point } from "./types";

// this can be extended with other types, eg. number[], Int32Array, Float32Array
// but must be data array that can hold negative numbers
// DO NOT USE Uint[8|16|32][Clamped]Array
type MaskData = Int8Array;

type Border = {
  // sequential number
  seqNum: number;
  // (i,j) points belonging to the border
  points: Array<Point>;
  // whether or not the border constitutes a hole
  isHole?: boolean;
  // the sequential number of the parent border
  parent?: number;
};

const N_PIXEL_NEIGHBOR = 8;

// returns a padded and binary mask of input mask
export function padMask(
  unpaddedMask: Array<number> | Uint8Array | Uint8ClampedArray,
  unPaddedWidth: number,
  unPaddedHeight: number
): MaskData {
  const paddedWidth = unPaddedWidth + 2;
  const paddedHeight = unPaddedHeight + 2;

  const paddedMask = new Int8Array(paddedWidth * paddedHeight);

  for (let y = 0; y < unPaddedHeight; y++) {
    for (let x = 0; x < unPaddedWidth; x++) {
      const unPaddedIdx = y * unPaddedWidth + x;
      const paddedIdx = (y + 1) * paddedWidth + (x + 1);

      paddedMask[paddedIdx] = unpaddedMask[unPaddedIdx] === 0 ? 0 : 1;
    }
  }

  return paddedMask;
}

// realigns contours such that the points they contain are with respect
// to the unpadded binary mask
function unpadContours(contours: Array<Border>) {
  const unpaddedContours: Array<Border> = [];

  for (const contour of contours) {
    unpaddedContours.push({
      ...contour,
      points: contour.points.map((p) => ({ x: p.x - 1, y: p.y - 1 })),
    });
  }

  return unpaddedContours;
}

function _f_ij(F: MaskData, width: number, _height: number) {
  return {
    get: (i: number, j: number) => F[i * width + j],
    set: (i: number, j: number, value: number) => {
      F[i * width + j] = value;
    },
  };
}

// give pixel neighborhood counter-clockwise ID's for
// easier access with findContour algorithm
function neighborIdxToCoord(i: number, j: number, id: number) {
  switch (id) {
    case 0:
      return [i, j + 1];
    case 1:
      return [i - 1, j + 1];
    case 2:
      return [i - 1, j];
    case 3:
      return [i - 1, j - 1];
    case 4:
      return [i, j - 1];
    case 5:
      return [i + 1, j - 1];
    case 6:
      return [i + 1, j];
    case 7:
      return [i + 1, j + 1];
    default:
      // return null;
      throw new Error(`Incorrect id, (${id}), must be in [0, 7]`);
  }
}

function neighborCoordToIdx(
  baseI: number,
  baseJ: number,
  neighborI: number,
  neighborJ: number
) {
  const di = neighborI - baseI;
  const dj = neighborJ - baseJ;

  if (di === 0 && dj === 1) {
    return 0;
  }
  if (di === -1 && dj === 1) {
    return 1;
  }
  if (di === -1 && dj === 0) {
    return 2;
  }
  if (di === -1 && dj === -1) {
    return 3;
  }
  if (di === 0 && dj === -1) {
    return 4;
  }
  if (di === 1 && dj === -1) {
    return 5;
  }
  if (di === 1 && dj === 0) {
    return 6;
  }
  if (di === 1 && dj === 1) {
    return 7;
  }
  // return -1;
  throw new Error(`Cannot find id with di ${di}, dj ${dj}`);
}

function logNeighbors(
  fij: ReturnType<typeof _f_ij>,
  baseI: number,
  baseJ: number,
  startIdx: number,
  offset: number,
  logMessage?: string
) {
  const neighborVals: Array<string | number> = [
    "_",
    "_",
    "_",
    "_",
    "_",
    "_",
    "_",
    "_",
  ];

  for (let ccwIdx = 0; ccwIdx < N_PIXEL_NEIGHBOR; ccwIdx++) {
    const neighborIdx =
      (ccwIdx + startIdx + offset + N_PIXEL_NEIGHBOR * 2) % N_PIXEL_NEIGHBOR;
    const ij = neighborIdxToCoord(baseI, baseJ, neighborIdx);

    neighborVals[neighborIdx] =
      neighborIdx === startIdx + offset
        ? `(${fij.get(ij[0], ij[1])})`
        : ` ${fij.get(ij[0], ij[1])} `;
  }

  logMessage && logger(logMessage);
  logger(`neighborhood: (${baseI}, ${baseJ})`);
  logger(
    `|${neighborVals[3]}|${neighborVals[2]}|${neighborVals[1]}|\n|${
      neighborVals[4]
    }| ${fij.get(baseI, baseJ)} |${neighborVals[0]}|\n|${neighborVals[5]}|${
      neighborVals[6]
    }|${neighborVals[7]}|`
  );
}

/**
 * First counter-clockwise non-zero element in neighborhood
 * also responsible in determining if the neighbor directly to
 * the right of the base coordinate is crossed (inspected)
 *
 * @param baseI The i coordinate of the point to search the neighborhood of
 * @param baseJ The j coordinate of the point to search the neighbrohood of
 * @param neighborI The i coordinate of the first point in the neighborhood to search
 *                  should i + (1, 0, or -1)
 * @param neighborJ The j coordinate of the first point in the neighborhood to search
 *                  should j + (1, 0, or -1)
 * @param offset An offset counterclockwise from the base point
 * @return object
 * @parameter ij: The (i,j) coords of the non-zero neighbor or null if absent
 * @parameter rightExamined: wether or not the right neighbor was inspected
 **/
function ccwNon0(
  fij: ReturnType<typeof _f_ij>,
  w: number,
  h: number,
  baseI: number,
  baseJ: number,
  neighborI: number,
  neighborJ: number,
  offset: number
) {
  let rightExamined = false;

  const startIdx = neighborCoordToIdx(baseI, baseJ, neighborI, neighborJ);
  for (let ccwIdx = 0; ccwIdx < N_PIXEL_NEIGHBOR; ccwIdx++) {
    const neighborIdx =
      (ccwIdx + startIdx + offset + N_PIXEL_NEIGHBOR * 2) % N_PIXEL_NEIGHBOR;

    rightExamined = neighborIdx === 0 ? true : rightExamined;

    const ij = neighborIdxToCoord(baseI, baseJ, neighborIdx);

    if (fij.get(ij[0], ij[1]) !== 0) {
      return { ij, rightExamined };
    }
  }
  import.meta.env.NODE_ENV !== "production" &&
    logNeighbors(
      fij,
      baseI,
      baseJ,
      startIdx,
      offset,
      "ccw scan - nothing found"
    );
  return { ij: null, rightExamined };
}

/**
 * First clockwise non-zero element in neighborhood
 * @param baseI The i coordinate of the point to search the neighborhood of
 * @param baseJ The j coordinate of the point to search the neighbrohood of
 * @param neighborI The i coordinate of the first point in the neighborhood to search
 *                  should i + (1, 0, or -1)
 * @param neighborJ The j coordinate of the first point in the neighborhood to search
 *                  should j + (1, 0, or -1)
 * @param offset An offset counterclockwise from the base point
 * @return The (i,j) coords of the non-zero neighbor or null if absent
 **/
function cwNon0(
  fij: ReturnType<typeof _f_ij>,
  w: number,
  h: number,
  baseI: number,
  baseJ: number,
  neighborI: number,
  neighborJ: number,
  offset: number
) {
  const startIdx = neighborCoordToIdx(baseI, baseJ, neighborI, neighborJ);
  for (let ccwIdx = 0; ccwIdx < N_PIXEL_NEIGHBOR; ccwIdx++) {
    const neighborIdx =
      (-ccwIdx + startIdx - offset + N_PIXEL_NEIGHBOR * 2) % N_PIXEL_NEIGHBOR;
    const ij = neighborIdxToCoord(baseI, baseJ, neighborIdx);
    if (fij.get(ij[0], ij[1]) !== 0) {
      return ij;
    }
  }
  return null;
}

/**
 * Find contours in a binary image
 * <p>
 * Implements Suzuki, S. and Abe, K.
 * Topological Structural Analysis of Digitized Binary Images by Border Following.
 * <p>
 * See source code for step-by-step correspondence to the paper's algorithm
 * description.
 * @param  F    The "Frame" (bitmap), stored in 1-dimensional row-major form.
 *              0=background, 1=foreground, will be modified by the function
 *              to hold semantic information
 * @param  width    Width of the bitmap
 * @param  height    Height of the bitmap
 * @return      An array of contours found in the image.
 * @see         Contour
 */
export const findContours = (F: MaskData, width: number, height: number) => {
  // Topological Structural Analysis of Digitized Binary Images by Border Following.
  // Suzuki, S. and Abe, K., CVGIP 30 1, pp 32-46 (1985)

  const contours: Array<Border> = [];

  // Without loss of generality, we assume that 0-pixels fill the frame
  // of a binary picture
  for (let i = 1; i < height - 1; i++) {
    F[i * width] = 0;
    F[i * width + width - 1] = 0;
  }
  for (let i = 0; i < width; i++) {
    F[i] = 0;
    F[width * height - 1 - i] = 0;
  }

  // Set nitially NBD to 1
  // (the frame of F forms a special hole border and gets the sequential number 1;
  //  NBD stands for the sequential number of the current border)
  let NBD = 1;

  // Scan the picture with a TV raster and perform the following steps
  // for each pixel such that fij != 0. Every time we begin to scan a
  // new row of the picture, reset LNBD to 1.
  // LNDB stands for the sequential number of the (outer or hole) border
  // encountered most recently
  let LNBD = 1;

  // The pixel located in the ith row and jth column is represented by the
  // row number (i, j)
  // fij is the value at coord (i,j) => F[i * width + j]
  const fij = _f_ij(F, width, height);

  // the row number i increases from top to bottom
  for (let iRaster = 1; iRaster < height - 1; iRaster++) {
    LNBD = 1;

    // the column number j from left to right
    for (let jRaster = 1; jRaster < width - 1; jRaster++) {
      let [i2CwStart, j2CwStart] = [0, 0];

      // scan until fij != 0
      if (fij.get(iRaster, jRaster) === 0) {
        continue;
      }

      // current border 0 used in (2)
      const B: Partial<Border> = {
        isHole: undefined,
        seqNum: undefined,
        points: [{ y: iRaster, x: jRaster }],
      };

      // (1) Select one of the following (1-a, 1-b, or 1-c):

      // (1-a) If fij = 1 and fi, j-1 = 0, then decide that the pixel
      //     (i, j) is the border following starting point of an outer
      //     border, increment NBD, and (i2, j2) <- (i, j - 1).
      if (
        fij.get(iRaster, jRaster) === 1 &&
        fij.get(iRaster, jRaster - 1) === 0
      ) {
        NBD++;
        [i2CwStart, j2CwStart] = [iRaster, jRaster - 1];
        B.isHole = false;
        B.seqNum = NBD;

        // (1-b) Else if fij >= 1 and fi,j+1 = 0, then decide that the
        //     pixel (i, j) is the border following starting point of a
        //     hole border, increment NBD, (i2, j2) <- (i, j + 1), and
        //     LNBD + fij in case fij > 1.
      } else if (
        fij.get(iRaster, jRaster) >= 1 &&
        fij.get(iRaster, jRaster + 1) === 0
        // not in original paper
        // account for special case for outer border covered by hole border
        // && fij.get(iRaster, jRaster - 1) !== 0
      ) {
        NBD++;
        [i2CwStart, j2CwStart] = [iRaster, jRaster + 1];
        if (fij.get(iRaster, jRaster) > 1) {
          LNBD = fij.get(iRaster, jRaster);
        }
        B.isHole = true;
        B.seqNum = NBD;
      } else {
        // (1-c) Otherwise, go to (4).
        //
        // (4) If fij != 1, then LNBD <- |fij| and resume the raster
        //     scan from pixel (i,j+1). The algorithm terminates when the
        //     scan reaches the lower right corner of the picture
        if (fij.get(iRaster, jRaster) !== 1) {
          LNBD = Math.abs(fij.get(iRaster, jRaster));
        }
        continue;
      }

      // (2) Depending on the types of the newly found border
      //     and the border with the sequential number LNBD
      //     (i.e., the last border met on the current row),
      //     decide the parent of the current border as shown in Table 1.
      //
      // TABLE 1
      // Decision Rule for the Parent Border of the Newly Found Border B
      // ----------------------------------------------------------------
      // Type of border B'
      // \    with the sequential
      //     \     number LNBD
      // Type of B \                Outer border         Hole border
      // ---------------------------------------------------------------
      // Outer border               The parent border    The border B'
      //                            of the border B'
      //
      // Hole border                The border B'      The parent border
      //                                               of the border B'
      // ----------------------------------------------------------------

      contours.push(B as Border);

      // default Bprime
      let Bprime: Border = {
        seqNum: LNBD,
        points: [],
        parent: LNBD,
      };

      // replace Bprime with already found border of that seqNum,
      // if available
      for (let c = 0; c < contours.length; c++) {
        if (contours[c].seqNum === LNBD) {
          Bprime = contours[c];
          break;
        }
      }

      if (Bprime.isHole) {
        if (B.isHole) {
          B.parent = Bprime.parent;
        } else {
          B.parent = Bprime.seqNum;
        }
      } else {
        if (B.isHole) {
          B.parent = Bprime.seqNum;
        } else {
          B.parent = Bprime.parent;
        }
      }

      // (3) From the starting point (i, j), follow the detected border:
      //     this is done by the following substeps (3.1) through (3.5).

      // (3.1) Starting from (i2, j2), look around clockwise the pixels
      //       in the neigh- borhood of (i, j) and find a nonzero pixel.
      //       Let (i1, j1) be the first found nonzero pixel. If no nonzero
      //       pixel is found, assign -NBD to fij and go to (4).
      const i1j1 = cwNon0(
        fij,
        width,
        height,
        iRaster,
        jRaster,
        i2CwStart,
        j2CwStart,
        0
      );
      if (i1j1 === null) {
        fij.set(iRaster, jRaster, -NBD);
        //go to (4)
        if (fij.get(iRaster, jRaster) !== 1) {
          LNBD = Math.abs(fij.get(iRaster, jRaster));
        }
        continue;
      }
      const [i1CwFound, j1CwFound] = i1j1;

      // (3.2) (i2, j2) <- (i1, j1) and (i3,j3) <- (i, j).
      let [i2PrevStep, j2PrevStep] = [i1CwFound, j1CwFound];
      let [i3CurrStep, j3CurrStep] = [iRaster, jRaster];

      // walk the border
      while (true) {
        // (3.3) Starting from the next elementof the pixel (i2, j2)
        //       in the counterclockwise order, examine counterclockwise
        //       the pixels in the neighborhood of the current pixel (i3, j3)
        //       to find a nonzero pixel and let the first one be (i4, j4).

        const { ij: i4j4, rightExamined } = ccwNon0(
          fij,
          width,
          height,
          i3CurrStep,
          j3CurrStep,
          i2PrevStep,
          j2PrevStep,
          1
        );

        if (i4j4 === null) {
          import.meta.env.NODE_ENV !== "production" &&
            console.warn(
              `i4j4 is invalid: i ${iRaster}, j ${jRaster}, i1 ${i1CwFound}, j1 ${j1CwFound}, i2 ${i2PrevStep}, j2 ${j2PrevStep}, i3 ${i3CurrStep}, j3 ${j3CurrStep}, i4j4j ${i4j4}`
            );
          // break;
        }

        const [i4CcwFound, j4CcwFound] = i4j4 as number[];

        // save the point
        contours[contours.length - 1].points.push({
          y: i4CcwFound,
          x: j4CcwFound,
        });

        // (3.4) Change the value fi3j3 of the pixel (i3, j3) as follows:

        // (3.4-a) If the pixel (i3, j3 + 1) is a O-pixel examined in the
        //     substep (3.3) then fi3, j3 <-  -NBD.
        if (fij.get(i3CurrStep, j3CurrStep + 1) === 0) {
          fij.set(
            i3CurrStep,
            j3CurrStep,
            // B.isHole to account for donut, see find-contours.test.ts
            rightExamined || B.isHole ? -NBD : NBD
          );

          // (3.4-b) If the pixel (i3, j3 + 1) is not a O-pixel examined
          //     in the substep (3.3) and fi3j3 = 1, then fi3j3 <- NBD.
        } else if (
          fij.get(i3CurrStep, j3CurrStep + 1) !== 0 &&
          fij.get(i3CurrStep, j3CurrStep) === 1
        ) {
          fij.set(i3CurrStep, j3CurrStep, NBD);
        } else {
          //(3.4-c) Otherwise, do not change fi3j3.
        }

        // (3.5) If (i4, j4) = (i, j) and (i3, j3) = (i1, j1)
        //      (coming back to the starting point), then go to (4);
        if (
          i4CcwFound === iRaster &&
          j4CcwFound === jRaster &&
          i3CurrStep === i1CwFound &&
          j3CurrStep === j1CwFound
        ) {
          if (fij.get(iRaster, jRaster) !== 1) {
            LNBD = Math.abs(fij.get(iRaster, jRaster));
          }
          break;

          // otherwise, (i2, j2) <- (i3, j3),(i3, j3) <- (i4, j4),
          // and go back to (3.3).
        } else {
          [i2PrevStep, j2PrevStep] = [i3CurrStep, j3CurrStep];
          [i3CurrStep, j3CurrStep] = [i4CcwFound, j4CcwFound];
        }
      }
    }
  }
  return unpadContours(contours);
};
