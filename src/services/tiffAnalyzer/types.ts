import { AnalyzeTiffOutput } from "workers/scheduler/types";

/**
 * TIFF IFD (Image File Directory) entry
 * Each frame in a TIFF has its own IFD
 */
export type TiffIFDEntry = {
  width: number;
  height: number;
  bitsPerSample: number[];
  samplesPerPixel: number;
  imageDescription?: string;
  dateTime?: string;
  software?: string;
};

/**
 * Parsed TIFF structure
 */
export type ParsedTiffStructure = {
  byteOrder: "little" | "big";
  ifdCount: number;
  ifds: TiffIFDEntry[];
  isOMETiff: boolean;
  omeXml?: string;
};

/**
 * Interface for TiffAnalyzerService.
 * Defines the contract for TIFF header analysis.
 * Used for dependency injection and mocking in tests.
 */
export interface ITiffAnalyzerService {
  analyze(buffer: ArrayBuffer): AnalyzeTiffOutput;
}
