import { decode } from "@ImageViewer/utils";
import {
  AnnotationObject,
  BitDepth,
  ChannelMeasurement,
} from "store/dataV2/types";
import { DataConnector } from "utils/data-connector";
import { STORES } from "utils/data-connector/types";

// Keeps Math.round(maskPixelCount * UPPER_QUARTILE) from landing outside the sorted sample array.
const MIN_QUARTILE_SAMPLE_SIZE = 4;
const LOWER_QUARTILE = 0.25;
const UPPER_QUARTILE = 0.75;

// `arr` must already be sorted ascending; `mp` is `arr.length / 2`.
const getMedian = (arr: number[], mp: number) => {
  return Number.isInteger(mp)
    ? (arr[mp - 1] + arr[mp]) / 2
    : arr[Math.floor(mp)];
};

const getChannelData = (
  chResults: Array<{
    id: string;
    bitDepth: BitDepth;
    data: ArrayBuffer;
    width: number;
  }>,
) => {
  const channelData: Array<{ id: string; data: Uint16Array | Uint8Array }> = [];
  let chW: number | undefined = undefined;
  chResults.forEach((ch) => {
    if (!chW) chW = ch.width;
    const chData: Uint8Array | Uint16Array =
      ch.bitDepth === 8 ? new Uint8Array(ch.data) : new Uint16Array(ch.data);
    channelData.push({ id: ch.id, data: chData });
  });
  return { chW, channelData };
};

export const computeObjectIntensityMeasurements = async (
  data: Array<{
    channelRefs: Array<{ id: string }>;
    objs: Array<
      Pick<
        AnnotationObject,
        "id" | "decodedMask" | "encodedMask" | "boundingBox" | "features"
      >
    >;
  }>,
) => {
  const dataConnector = DataConnector.getInstance();
  const objMeasurements: Record<
    string,
    Record<string, Record<ChannelMeasurement, number>>
  > = {};

  for (const batch of data) {
    const result = await dataConnector.retrieveBatch(
      batch.channelRefs.map((c) => ({
        id: c.id,
        storeName: STORES.CHANNEL_DATA,
      })),
    );
    if (!result.success) {
      console.error(`Error fetching channel data: ${result.error}`);
      continue;
    }

    const { chW, channelData } = getChannelData([...result.data.values()]);

    for (const obj of batch.objs) {
      const bbox = obj.boundingBox;
      const decodedMask = obj.decodedMask
        ? Uint8ClampedArray.from(obj.decodedMask)
        : decode(obj.encodedMask);
      const maskWidth = bbox[2] - bbox[0];
      const x0 = bbox[0];
      const y0 = bbox[1];

      const maskPixelCount = decodedMask.reduce(
        (count, v) => count + (v !== 0 ? 1 : 0),
        0,
      );
      if (maskPixelCount < MIN_QUARTILE_SAMPLE_SIZE) {
        console.warn(
          `Skipping intensity measurements for object ${obj.id}: mask has only ${maskPixelCount} pixel(s)`,
        );
        continue;
      }

      const chMeasurements: Record<
        string,
        Record<ChannelMeasurement, number>
      > = {};

      channelData.forEach((ch) => {
        const maskData: number[] = [];
        let total = 0;
        for (let i = 0; i < decodedMask.length; i++) {
          if (decodedMask[i] === 0) continue;
          const x = i % maskWidth;
          const y = Math.floor(i / maskWidth);
          const chIdx = (y + y0) * chW! + (x + x0);
          const val = ch.data[chIdx];
          total += val;
          maskData.push(val);
        }

        const sortedData = maskData.sort((a, b) => a - b);
        const maskL = maskData.length;
        const midpnt = maskL / 2;
        const lQuartIdx = Math.round(maskL * LOWER_QUARTILE);
        const uQuartIdx = Math.round(maskL * UPPER_QUARTILE);

        const mean = total / maskL;
        const median = getMedian(sortedData, midpnt);

        let max = 0;
        let min = Infinity;
        let lQuart = 0;
        let uQuart = 0;
        const absDevs: number[] = [];
        let sumSqDev = 0;

        for (let i = 0; i < sortedData.length; i++) {
          const val = sortedData[i];
          if (val > max) max = val;
          if (val < min) min = val;
          sumSqDev += (val - mean) ** 2;
          absDevs.push(Math.abs(val - median));
          if (i === lQuartIdx) lQuart = val;
          if (i === uQuartIdx) uQuart = val;
        }

        const std = Math.sqrt(sumSqDev / maskL);
        const mad = getMedian(
          absDevs.sort((a, b) => a - b),
          midpnt,
        );

        chMeasurements[ch.id] = {
          maxValue: max,
          minValue: min,
          total,
          mean,
          median,
          std,
          mad,
          lowerQuartile: lQuart,
          upperQuartile: uQuart,
        };
      });

      objMeasurements[obj.id] = chMeasurements;
    }
  }

  return objMeasurements;
};

export const computeObjectIntensityMeasurementsLocal = async (
  data: Array<{
    channelRefs: Array<{
      id: string;
      data: ArrayBuffer;
      bitDepth: BitDepth;
      width: number;
    }>;
    objs: Array<
      Pick<
        AnnotationObject,
        "id" | "decodedMask" | "encodedMask" | "boundingBox" | "features"
      >
    >;
  }>,
) => {
  const objMeasurements: Record<
    string,
    Record<string, Record<ChannelMeasurement, number>>
  > = {};

  for (const batch of data) {
    const { chW, channelData } = getChannelData(batch.channelRefs);

    for (const obj of batch.objs) {
      const bbox = obj.boundingBox;
      const decodedMask = obj.decodedMask
        ? Uint8ClampedArray.from(obj.decodedMask)
        : decode(obj.encodedMask);
      const maskWidth = bbox[2] - bbox[0];
      const x0 = bbox[0];
      const y0 = bbox[1];

      const maskPixelCount = decodedMask.reduce(
        (count, v) => count + (v !== 0 ? 1 : 0),
        0,
      );
      if (maskPixelCount < MIN_QUARTILE_SAMPLE_SIZE) {
        console.warn(
          `Skipping intensity measurements for object ${obj.id}: mask has only ${maskPixelCount} pixel(s)`,
        );
        continue;
      }

      const chMeasurements: Record<
        string,
        Record<ChannelMeasurement, number>
      > = {};

      channelData.forEach((ch) => {
        const maskData: number[] = [];
        let total = 0;
        for (let i = 0; i < decodedMask.length; i++) {
          if (decodedMask[i] === 0) continue;
          const x = i % maskWidth;
          const y = Math.floor(i / maskWidth);
          const chIdx = (y + y0) * chW! + (x + x0);
          const val = ch.data[chIdx];
          total += val;
          maskData.push(val);
        }

        const sortedData = maskData.sort((a, b) => a - b);
        const maskL = maskData.length;
        const midpnt = maskL / 2;
        const lQuartIdx = Math.round(maskL * LOWER_QUARTILE);
        const uQuartIdx = Math.round(maskL * UPPER_QUARTILE);

        const mean = total / maskL;
        const median = getMedian(sortedData, midpnt);

        let max = 0;
        let min = Infinity;
        let lQuart = 0;
        let uQuart = 0;
        const absDevs: number[] = [];
        let sumSqDev = 0;

        for (let i = 0; i < sortedData.length; i++) {
          const val = sortedData[i];
          if (val > max) max = val;
          if (val < min) min = val;
          sumSqDev += (val - mean) ** 2;
          absDevs.push(Math.abs(val - median));
          if (i === lQuartIdx) lQuart = val;
          if (i === uQuartIdx) uQuart = val;
        }

        const std = Math.sqrt(sumSqDev / maskL);
        const mad = getMedian(
          absDevs.sort((a, b) => a - b),
          midpnt,
        );

        chMeasurements[ch.id] = {
          maxValue: max,
          minValue: min,
          total,
          mean,
          median,
          std,
          mad,
          lowerQuartile: lQuart,
          upperQuartile: uQuart,
        };
      });

      objMeasurements[obj.id] = chMeasurements;
    }
  }

  return objMeasurements;
};
