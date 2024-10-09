import { logger } from "utils/common/helpers";
import {
  BaseIFD,
  IFD,
  IFDTag,
  TIFF_OFFSETS,
  TiffTag,
  tagLookup,
  tagType,
} from "./tiffUtils";

export class TiffIO {
  // Initialize typed arrays for binary operations
  private ui8 = new Uint8Array(8);
  private i16 = new Int16Array(this.ui8.buffer);
  private i32 = new Int32Array(this.ui8.buffer);
  private ui32 = new Uint32Array(this.ui8.buffer);
  private fl32 = new Float32Array(this.ui8.buffer);
  private fl64 = new Float64Array(this.ui8.buffer);

  // Define binary operations for big endian
  private _binBE = {
    // Function to find the next zero in the buffer
    nextZero: (data: Uint8Array, offset: number) => {
      while (data[offset] !== 0) offset++;
      return offset;
    },

    // Function to read an unsigned short (2 bytes) from the buffer
    readUshort: (buffer: Uint8Array, position: number) => {
      return (buffer[position] << 8) | buffer[position + 1];
    },

    // Function to read a signed short (2 bytes) from the buffer
    readShort: (buffer: Uint8Array, position: number) => {
      var byteArray = this.ui8;
      byteArray[0] = buffer[position + 1];
      byteArray[1] = buffer[position + 0];
      return this.i16[0];
    },

    // Function to read a signed integer (4 bytes) from the buffer
    readInt: (buffer: Uint8Array, position: number) => {
      var byteArray = this.ui8;
      byteArray[0] = buffer[position + 3];
      byteArray[1] = buffer[position + 2];
      byteArray[2] = buffer[position + 1];
      byteArray[3] = buffer[position + 0];
      return this.i32[0];
    },

    // Function to read an unsigned integer (4 bytes) from the buffer
    readUint: (buffer: Uint8Array, position: number) => {
      var byteArray = this.ui8;
      byteArray[0] = buffer[position + 3];
      byteArray[1] = buffer[position + 2];
      byteArray[2] = buffer[position + 1];
      byteArray[3] = buffer[position + 0];
      return this.ui32[0];
    },

    // Function to read an ASCII string from the buffer
    readASCII: (buffer: Uint8Array, position: number, length: number) => {
      var string = "";
      for (var i = 0; i < length; i++) {
        string += String.fromCharCode(buffer[position + i]);
      }
      return string;
    },

    // Function to read a float (4 bytes) from the buffer
    readFloat: (buffer: Uint8Array, position: number) => {
      var byteArray = this.ui8;
      for (var i = 0; i < 4; i++) {
        byteArray[i] = buffer[position + 3 - i];
      }
      return this.fl32[0];
    },

    // Function to read a double (8 bytes) from the buffer
    readDouble: (buffer: Uint8Array, position: number) => {
      var byteArray = this.ui8;
      for (var i = 0; i < 8; i++) {
        byteArray[i] = buffer[position + 7 - i];
      }
      return this.fl64[0];
    },

    // Function to write an unsigned short (2 bytes) to the buffer
    writeUshort: (buffer: Uint8Array, position: number, number: number) => {
      buffer[position] = (number >> 8) & 255;
      buffer[position + 1] = number & 255;
    },

    // Function to write a signed integer (4 bytes) to the buffer
    writeInt: (buffer: Uint8Array, position: number, number: number) => {
      var byteArray = this.ui8;
      this.i32[0] = number;
      buffer[position + 3] = byteArray[0];
      buffer[position + 2] = byteArray[1];
      buffer[position + 1] = byteArray[2];
      buffer[position + 0] = byteArray[3];
    },

    // Function to write an unsigned integer (4 bytes) to the buffer
    writeUint: (buffer: Uint8Array, position: number, number: number) => {
      buffer[position] = (number >> 24) & 255;
      buffer[position + 1] = (number >> 16) & 255;
      buffer[position + 2] = (number >> 8) & 255;
      buffer[position + 3] = number & 255;
    },

    // Function to write an ASCII string to the buffer
    writeASCII: (buffer: Uint8Array, position: number, string: string) => {
      for (var i = 0; i < string.length; i++) {
        buffer[position + i] = string.charCodeAt(i);
      }
    },

    // Function to write a double (8 bytes) to the buffer
    writeDouble: (buffer: Uint8Array, position: number, number: number) => {
      this.fl64[0] = number;
      for (var i = 0; i < 8; i++) {
        buffer[position + i] = this.ui8[7 - i];
      }
    },
  };

  // Define binary operations for little endian
  private _binLE = {
    nextZero: this._binBE.nextZero,

    // Function to read an unsigned short (2 bytes) from the buffer
    readUshort: (buff: Uint8Array, position: number) =>
      (buff[position + 1] << 8) | buff[position],

    // Function to read a signed short (2 bytes) from the buffer
    readShort: (buff: Uint8Array, position: number) => {
      var a = this.ui8;
      a[0] = buff[position + 0];
      a[1] = buff[position + 1];
      return this.i16[0];
    },

    // Function to read a signed integer (4 bytes) from the buffer
    readInt: (buff: Uint8Array, position: number) => {
      var a = this.ui8;
      a[0] = buff[position + 0];
      a[1] = buff[position + 1];
      a[2] = buff[position + 2];
      a[3] = buff[position + 3];
      return this.i32[0];
    },

    // Function to read an unsigned integer (4 bytes) from the buffer
    readUint: (buff: Uint8Array, position: number) => {
      var a = this.ui8;
      a[0] = buff[position + 0];
      a[1] = buff[position + 1];
      a[2] = buff[position + 2];
      a[3] = buff[position + 3];
      return this.ui32[0];
    },

    // Function to read an ASCII string from the buffer
    readASCII: this._binBE.readASCII,

    // Function to read a float (4 bytes) from the buffer
    readFloat: (buff: Uint8Array, position: number) => {
      var a = this.ui8;
      for (var i = 0; i < 4; i++) a[i] = buff[position + i];
      return this.fl32[0];
    },

    // Function to read a double (8 bytes) from the buffer
    readDouble: (buff: Uint8Array, position: number) => {
      var a = this.ui8;
      for (var i = 0; i < 8; i++) a[i] = buff[position + i];
      return this.fl64[0];
    },

    // Function to write an unsigned short (2 bytes) to the buffer
    writeUshort: (buff: Uint8Array, position: number, number: number) => {
      buff[position] = number & 255;
      buff[position + 1] = (number >> 8) & 255;
    },

    // Function to write a signed integer (4 bytes) to the buffer
    writeInt: (buff: Uint8Array, position: number, number: number) => {
      var a = this.ui8;
      this.i32[0] = number;
      buff[position + 0] = a[0];
      buff[position + 1] = a[1];
      buff[position + 2] = a[2];
      buff[position + 3] = a[3];
    },

    // Function to write an unsigned integer (4 bytes) to the buffer
    writeUint: (buff: Uint8Array, position: number, number: number) => {
      buff[position] = (number >>> 0) & 255;
      buff[position + 1] = (number >>> 8) & 255;
      buff[position + 2] = (number >>> 16) & 255;
      buff[position + 3] = (number >>> 24) & 255;
    },

    // Function to write an ASCII string to the buffer
    writeASCII: this._binBE.writeASCII,
  };

  // Function to decode a Uint8Array into an array of IFDs
  /**
   * Decodes a Uint8Array into an array of IFDs (Image File Directories).
   *
   * This function reads the TIFF header, determines the byte order, and then iterates through the IFDs in the file.
   * For each IFD, it reads the number of entries, and then iterates through each entry, reading the tag, type, count, and value offset.
   * Depending on the type, it reads the value(s) from the buffer and stores them in an IFD object.
   *
   * @param data The Uint8Array containing the TIFF file data.
   * @return An array of IFD objects, each representing an Image File Directory in the TIFF file.
   */
  public decode(data: Uint8Array) {
    let offset = 0;

    // Read the TIFF header to determine the byte order
    const id = this._binBE.readASCII(data, offset, TIFF_OFFSETS.header.id);
    offset += TIFF_OFFSETS.header.id;
    // Select the binary operations based on the byte order
    const bin = id === "II" ? this._binLE : this._binBE;
    offset += TIFF_OFFSETS.header.version;
    // Read the offset of the first IFD
    let ifdo = bin.readUint(data, offset);
    const ifds = [];
    // Loop through each IFD
    while (true) {
      // Read the number of entries in the current IFD
      const cnt = bin.readUshort(data, ifdo); // Number of entries in the IFD
      // Read the first tag in the IFD to check for errors
      const _tag = bin.readUshort(data, ifdo + TIFF_OFFSETS.ifd.numFields);
      // Read the type of the first tag to check for errors
      const typ = bin.readUshort(
        data,
        ifdo + TIFF_OFFSETS.ifd.numFields + TIFF_OFFSETS.field.tagID
      );

      // Check for errors in the first tag and type
      if (cnt !== 0)
        if (typ < 1 || 13 < typ) {
          logger(
            `error in TIFF -- tag: ${_tag} -- count: ${cnt} -- type: ${typ}`
          );
          break;
        }

      let inner_offset = ifdo;
      inner_offset += TIFF_OFFSETS.ifd.numFields; // points to tag_id

      const ifd: IFD = {};
      // Loop through each tag in the IFD
      for (let i = 0; i < cnt; i++) {
        // Read the tag ID
        const tag = bin.readUshort(data, inner_offset);
        inner_offset += 2; // points to tag_type
        // Read the tag type
        const type = bin.readUshort(data, inner_offset);
        inner_offset += 2; // points to tag_count
        // Read the count of values for the tag
        let count = bin.readUint(data, inner_offset);
        inner_offset += 4; // points to tag_value_offset
        // Read the value offset for the tag
        const voff = bin.readUint(data, inner_offset);
        inner_offset += 4; // points to next tag_id

        // Initialize an array to hold the tag values
        let arr: IFDTag = [];
        // Handle different tag types
        if (type === 1 || type === 7) {
          // BYTE or UNDEFINE
          // Adjust the offset based on the count to read the values
          const no = count < 5 ? inner_offset - 4 : voff;
          if (no + count > data.buffer.byteLength)
            // Adjust the count if it exceeds the buffer length
            count = data.buffer.byteLength - no;
          // Create a new Uint8Array to hold the values
          arr = new Uint8Array(data.buffer, no, count);
        }
        if (type === 2) {
          // ASCII
          // Adjust the offset based on the count to read the values
          const o0 = count < 5 ? inner_offset - 4 : voff;
          const c = data[o0];
          const len = Math.max(0, Math.min(count - 1, data.length - o0));
          if (c < 128 || len === 0) {
            // Read the ASCII string
            (arr as any[]).push(bin.readASCII(data, o0, len));
          } else {
            // Create a new Uint8Array to hold the values
            arr = new Uint8Array(data.buffer, o0, len);
          }
        }
        if (type === 3) {
          // SHORT

          for (let j = 0; j < count; j++)
            (arr as any[]).push(
              bin.readUshort(
                data,
                (count < 3 ? inner_offset - 4 : voff) + 2 * j
              )
            );
        }
        if (type === 4 || type === 13) {
          // LONG or SLONG

          for (let j = 0; j < count; j++)
            (arr as any[]).push(
              bin.readUint(data, (count < 2 ? inner_offset - 4 : voff) + 4 * j)
            );
        }
        if (type === 5 || type === 10) {
          // RATIONAL or SRATIONAL

          const ri = type === 5 ? bin.readUint : bin.readInt;
          for (let j = 0; j < count; j++)
            (arr as any[]).push([
              ri(data, voff + j * 8),
              ri(data, voff + j * 8 + 4),
            ]);
        }
        if (type === 8) {
          // SSHORT

          for (let j = 0; j < count; j++)
            (arr as any[]).push(
              bin.readShort(data, (count < 3 ? inner_offset - 4 : voff) + 2 * j)
            );
        }
        if (type === 9) {
          // SLONG

          for (let j = 0; j < count; j++)
            (arr as any[]).push(
              bin.readInt(data, (count < 2 ? inner_offset - 4 : voff) + 4 * j)
            );
        }
        if (type === 11) {
          // FLOAT

          for (let j = 0; j < count; j++)
            (arr as any[]).push(bin.readFloat(data, voff + j * 4));
        }
        if (type === 12) {
          // DOUBLE

          for (let j = 0; j < count; j++)
            (arr as any[]).push(bin.readDouble(data, voff + j * 8));
        }

        // Check if the tag values array is empty after reading
        if (count !== 0 && arr.length === 0) {
          logger(`${tag} unknown TIFF tag type:  ${type} num: ${count}`);
          if (i === 0) return;
          continue;
        }

        // Store the tag values in the IFD object
        ifd[("" + tag) as keyof IFD] = arr;

        // Handle specific tags that require additional processing
        if (
          !(
            tag === 330 &&
            ifd["272"] &&
            (ifd["272"] as TiffTag)[0] === "DSLR-A100"
          ) &&
          ([330, 34665, 34853, 50740, 61440].includes(tag) ||
            (tag === 50740 &&
              bin.readUshort(data, bin.readUint(arr as Uint8Array, 0)) < 300) ||
            tag === 61440)
        ) {
          // Process sub-IFDs for specific tags
          const oarr =
            tag === 50740
              ? [bin.readUint(arr as Uint8Array, 0)]
              : (arr as Uint8Array);
          const subfd: Uint8Array[] = [];
          for (let j = 0; j < oarr.length; j++)
            //@ts-ignore
            TiffIO._readIFD(bin, data, oarr[j], subfd, depth + 1, prm);
          //@ts-ignore
          if (tag === 330) ifd.subIFD = subfd;
          //@ts-ignore
          if (tag === 34665) ifd.exifIFD = subfd[0];
          //@ts-ignore
          if (tag === 34853) ifd.gpsiIFD = subfd[0];
          //@ts-ignore
          if (tag === 50740) ifd.dngPrvt = subfd[0];
          //@ts-ignore
          if (tag === 61440) ifd.fujiIFD = subfd[0];
        }
      }

      ifdo = bin.readUint(data, ifdo + 2 + cnt * 12);

      ifds.push({ ...ifd, nextIFD: ifdo });

      if (ifdo === 0) break;
    }

    return ifds;
  }

  /**
   * Encodes an image into an ArrayBuffer.
   *
   * This function takes in image data and either IFD metadata or image information to encode the image.
   *
   * @param imageData - The image data to be encoded, either as a Uint8Array or Uint16Array.
   * @param ifdsOrInfo - Either an array of IFD objects or an object containing image information (width, height, channels, metadata).
   * @param ifdBlockSize - Optional parameter specifying the block size for IFD data. Defaults to 1000 if not provided.
   * @returns An ArrayBuffer containing the encoded image data.
   */
  public encodeImage(
    imageData: Uint8Array | Uint16Array,
    imageInfo: {
      w: number;
      h: number;
      channels: number;
      metadata: Partial<IFD>;
    }
  ): ArrayBuffer;
  public encodeImage(
    imageData: Uint8Array | Uint16Array,
    ifds: IFD[],
    ifdBlockSize: number
  ): ArrayBuffer;
  public encodeImage(
    imageData: Uint8Array | Uint16Array,
    ifdsOrInfo:
      | IFD[]
      | { w: number; h: number; channels: number; metadata: Partial<IFD> },
    ifdBlockSize?: number
  ): ArrayBuffer {
    // Initialize IFDs array and set default IFD block size if not provided
    let ifds: IFD[] = [];
    ifdBlockSize = ifdBlockSize ?? 1000;
    const bitSize = imageData.BYTES_PER_ELEMENT * 8;
    // Check if ifdsOrInfo is an array of IFDs or an object containing image information
    if (!Array.isArray(ifdsOrInfo)) {
      // Extract image information from the object
      const { w, h, channels, metadata } = ifdsOrInfo;

      // Calculate bits per pixel for each channel
      const bitsPerPixel = [bitSize].reduce((repeated: number[], val) => {
        for (let i = 0; i < channels; i++) {
          repeated.push(val);
        }
        return repeated;
      }, []);
      // Initialize default IFDs array if it's not already initialized
      const defaultIfds: BaseIFD[] = [];
      if (!ifds) {
        // Create a default IFD object with required fields populated
        const defaultIFD = {
          "254": [2],
          "256": [w], // width
          "257": [h], // height
          "258": bitsPerPixel, // bits per pixel
          "259": [1], // compression
          "262": [2], // photometric interpretation
          "273": [ifdBlockSize], // strips offset
          "277": [channels], // samples per pixel
          "278": [h], // rows per strip
          "279": [w * h * channels], // strip byte counts
          "282": [[72, 1]], // x resolution
          "283": [[72, 1]], // y resolution
          "284": [1], // planar configuration
          "296": [1], // resolution unit
          "338": [1], // extra samples
          ...metadata,
        };
        defaultIfds.push(defaultIFD);
      }
    } else {
      // If ifdsOrInfo is an array of IFDs, assign it directly
      ifds = ifdsOrInfo;
    }
    // Encode the IFDs into a prefix including header
    const prfx = new Uint8Array(this.encode(ifds));

    // Create a new Uint8Array to hold the final encoded image data
    const data = new Uint8Array(ifdBlockSize + imageData.byteLength);
    // Copy the prefix into the data array
    for (let i = 0; i < prfx.length; i++) {
      data[i] = prfx[i];
    }
    // Copy the image data into the data array after the prefix
    const buffered = new Uint8Array(imageData.buffer);
    for (let i = 0; i < buffered.length; i++) {
      data[ifdBlockSize + i] = buffered[i];
    }
    // Return the ArrayBuffer containing the encoded image data
    return data.buffer;
  }

  /**
   * Encodes the provided IFDs into a TIFF image prefix including the header.
   *
   * @param ifds - An array of IFD (Image File Directory) objects to be encoded.
   * @param encoding - The byte order to use for encoding. Defaults to "LE" (Little Endian).
   * @returns - An ArrayBuffer containing the encoded TIFF image prefix.
   */
  public encode(ifds: IFD[], encoding: "BE" | "LE" = "LE") {
    // Initialize the data array and set the initial offset
    const data = new Uint8Array(20000);
    var offset = 4;
    // Determine the binary operations to use based on the encoding
    var bin = encoding === "LE" ? this._binLE : this._binBE;
    // Write the TIFF header
    data[0] = data[1] = encoding === "LE" ? 73 : 77;
    bin.writeUshort(data, 2, 42);
    var ifdo = 8;
    bin.writeUint(data, offset, ifdo);

    offset += 4;

    // Iterate through each IFD and write it to the data array
    for (var i = 0; i < ifds.length; i++) {
      // Write the current IFD and get the offset of the next IFD
      var noffs = this.writeIFD(bin, tagType.basic, data, ifdo, ifds[i]);
      // Update the offset for the next IFD
      ifdo = noffs[1];

      // If it's not the last IFD, ensure the next IFD starts at a multiple of 4
      if (i < ifds.length - 1) {
        if ((ifdo & 3) !== 0) ifdo += 4 - (ifdo & 3); // make each IFD start at multiple of 4
        // Write the updated offset of the next IFD
        bin.writeUint(data, noffs[0], ifdo);
      }
    }
    // Return the encoded TIFF image prefix as an ArrayBuffer
    return data.slice(0, ifdo).buffer;
  }
  /**
   * Writes the Image File Directory (IFD) to the provided data array.
   *
   * @param bin - The binary operations to use for encoding.
   * @param types - The types of the IFD.
   * @param data - The data array to write the IFD to.
   * @param offset - The initial offset in the data array.
   * @param ifd - The IFD to be written.
   * @returns - An array containing the updated offset and the final offset for the values.
   */
  public writeIFD(
    bin: any,
    types: typeof tagType.basic | typeof tagType.gps,
    data: Uint8Array,
    offset: number,
    ifd: IFD
  ): [number, number] {
    // Count the number of entries, excluding exifIFD and gpsiIFD
    var keys = Object.keys(ifd);
    var knum = keys.length;
    if (ifd["exifIFD"]) knum--;
    if (ifd["gpsiIFD"]) knum--;

    // Write the number of entries
    bin.writeUshort(data, offset, knum);
    offset += 2;

    // Calculate the initial offset for the values
    var eoff = offset + knum * 12 + 4;

    // Iterate through all keys in the IFD
    for (var ki = 0; ki < keys.length; ki++) {
      var key = keys[ki] as keyof IFD;

      // Handle special cases for EXIF and GPS IFDs
      if (key === "34665" || key === "34853") continue;
      if (key === "exifIFD") key = "34665";
      if (key === "gpsiIFD") key = "34853";

      var tag = parseInt(key);
      var type = types.main[tag] ?? types.rest[tag];
      if (type === null || type === 0)
        throw new Error("unknown type of tag: " + tag);

      var val: TiffTag | Uint8Array | string | number[][] | IFD = ifd[key]!;

      // Handle EXIF IFD
      if (tag === 34665) {
        const outp = this.writeIFD(
          bin,
          types,
          data,
          eoff,
          ifd["exifIFD"] as IFD
        );
        val = [eoff];
        eoff = outp[1];
      }

      // Handle GPS IFD
      if (tag === 34853) {
        const outp = this.writeIFD(
          bin,
          tagType.gps,
          data,
          eoff,
          ifd["gpsiIFD"] as IFD
        );
        val = [eoff];
        eoff = outp[1];
      }
      val = val as TiffTag | Uint8Array | string | number[][];

      // Handle ASCII strings
      if (type === 2) val = val[0] + "\u0000";

      var num = val.length;

      // Write tag, type, and count
      bin.writeUshort(data, offset, tag);
      offset += 2;
      bin.writeUshort(data, offset, type);
      offset += 2;
      bin.writeUint(data, offset, num);
      offset += 4;

      // Calculate data length and offset
      var dlen = [-1, 1, 1, 2, 4, 8, 0, 1, 0, 4, 8, 0, 8][type] * num;
      var toff = offset;
      if (dlen > 4) {
        bin.writeUint(data, offset, eoff);
        toff = eoff;
      }

      // Write the actual data based on its type
      if (type === 1 || type === 7) {
        // BYTE or UNDEFINE
        for (var i = 0; i < num; i++) data[toff + i] = val[i] as number;
      } else if (type === 2) {
        // ASCII
        bin.writeASCII(data, toff, val);
      } else if (type === 3) {
        // SHORT
        for (let i = 0; i < num; i++)
          bin.writeUshort(data, toff + 2 * i, val[i]);
      } else if (type === 4) {
        // LONG
        for (let i = 0; i < num; i++) bin.writeUint(data, toff + 4 * i, val[i]);
      } else if (type === 5 || type === 10) {
        // RATIONAL or SRATIONAL
        var wr = type === 5 ? bin.writeUint : bin.writeInt;
        for (let i = 0; i < num; i++) {
          var v = val[i] as number[];
          var nu = v[0];
          var de = v[1];
          if (nu === null)
            throw new Error(`Invalid number ${v} for tag ${tag}`);
          wr(data, toff + 8 * i, nu);
          wr(data, toff + 8 * i + 4, de);
        }
      } else if (type === 9) {
        //SLONG
        for (let i = 0; i < num; i++) bin.writeInt(data, toff + 4 * i, val[i]);
      } else if (type === 12) {
        // DOUBLE
        for (let i = 0; i < num; i++)
          bin.writeDouble(data, toff + 8 * i, val[i]);
      } else throw type;

      // Adjust offset for data longer than 4 bytes
      if (dlen > 4) {
        dlen += dlen & 1;
        eoff += dlen;
      }
      offset += 4;
    }

    return [offset, eoff];
  }
  /**
   * Retrieves the size of a given TIFF tag in bytes.
   *
   * @param tag - The tag to retrieve the size for. This can be a string representing the tag name or a number representing the tag code.
   * @returns The size of the tag in bytes.
   * @throws Error if the tag is unknown or its size cannot be determined.
   */
  public getTagSize(tag: string | number): number {
    // Convert string tag to numeric tag if necessary
    if (typeof tag === "string") {
      tag = tagLookup[tag];
    }
    // Validate the tag
    if (!tag) throw new Error("Unknown IFD tag");
    // Retrieve the byte size of the tag
    const byteSize = TIFF_OFFSETS.tag[+tag];
    // Validate the byte size
    if (!byteSize) throw new Error("Unknown tag size");
    // Return the byte size
    return byteSize;
  }
  /**
   * This function generates an IFD (Image File Directory) object.
   *
   * @param ifd - The base IFD object to generate the IFD from.
   * @param ifdCount - The number of IFDs to generate.
   * @returns - An object containing the generated IFDs and the size of the IFD block.
   */
  public generateIFDObject(ifd: BaseIFD, ifdCount: number) {
    // Extract image dimensions and bits per sample from the IFD
    const imWidth = (ifd["256"] as number[])[0];
    const imHeight = (ifd["257"] as number[])[0];
    const bitsPerSample = (ifd["258"] as number[])[0];

    // Calculate the size of extra values in the IFD
    const keys = Object.keys(ifd);
    const extraValuesSize = keys.reduce((sum: number, key) => {
      const dataSize = TIFF_OFFSETS.tag[key] ?? 2;
      return sum + dataSize;
    }, 0);

    // Calculate the total size of a single IFD
    const ifdSize =
      TIFF_OFFSETS.ifd.numFields +
      TIFF_OFFSETS.ifd.fieldSize * keys.length +
      TIFF_OFFSETS.ifd.ifdo +
      extraValuesSize;

    // Calculate the total size of the IFD block
    const ifdBlockSize = ifdSize * ifdCount;

    // Initialize an array to hold the generated IFDs
    const ifds: BaseIFD[] = [];

    // Generate IFD objects with updated strip offset values
    for (let i = 0; i < ifdCount; i++) {
      ifds.push({
        ...ifd,
        "273": [ifdBlockSize + (i * imWidth * imHeight * bitsPerSample) / 8],
      });
    }

    // Return the generated IFDs and the total size of all IFD blocks
    return { ifds, ifdBlockSize };
  }
}
