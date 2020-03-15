import { Ecc } from './ecc';
import { QrSegment } from './qr-segment';

/*
  A QR Code symbol, which is a type of two-dimensional barcode.
  Invented by Denso Wave and described in the ISO/IEC 18004 standard.
  Instances of this class represent an immutable square grid of black and white cells.
  The class provides static factory functions to create a QR Code from text or binary data.
  The class covers the QR Code Model 2 specification, supporting all versions (sizes)
  from 1 to 40, all 4 error correction levels, and 4 character encoding modes.

  Ways to create a QR Code object:
  - High level: Take the payload data nd call QrCode.encodeText() or QrCode.encodeBinary().
  - Mid level: Custom-make the list of segments and call QrCode.encodeSegments().
  - Low level: Custom-make the array of data codeword bytes (including
    segment headers and final padding, excluding error correction codewords),
    supply the appropriate version number, and call the QrCode() constructor.
    (Note that all ways require supplying the desired error correction level.)
*/
export class QrCode {
  // For use in getPenaltyScore(), when evaluating which mask is best.
  private static readonly PENALTY_N1: number = 3;
  private static readonly PENALTY_N2: number = 3;
  private static readonly PENALTY_N3: number = 40;
  private static readonly PENALTY_N4: number = 10;

  private static readonly ECC_CODEWORDS_PER_BLOCK: Array<Array<number>> = [
    // Version: (note that index 0 is for padding, and is set to an illegal value)
    //0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40    Error correction level
    [-1,  7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],  // Low
    [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],  // Medium
    [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],  // Quartile
    [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],  // High
  ]
  private static readonly NUM_ERROR_CORRECTION_BLOCKS: Array<Array<number>> = [
    // Version: (note that index 0 is for padding, and is set to an illegal value)
    //0, 1, 2, 3, 4, 5, 6, 7, 8, 9,10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40    Error correction level
    [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4,  4,  4,  4,  4,  6,  6,  6,  6,  7,  8,  8,  9,  9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],  // Low
    [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5,  5,  8,  9,  9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],  // Medium
    [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8,  8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],  // Quartile
    [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81],  // High
  ];

  // The minimum version number supported in the QR Code Model 2 standard.
  public static readonly MIN_VERSION: number = 1;
  // The maximum version number supported in the QR Code Model 2 standard.
  public static readonly MAX_VERSION: number = 40;

  // The modules of this QR Code (false = white, true = black).
  // Immutable after constructor finishes. Accessed through getModule().
  private readonly modules: Array<Array<boolean>> = [];

  // Indicates function modules that are not subjected to masking. Discarded when the constructor finishes.
  private readonly isFunction: Array<Array<boolean>> = [];

  // The width and height of this QR Code, measured in modules, between
  // 21 and 177 (inclusive). This is equal to version * 4 + 17.
  public readonly size: number;

  // Creates a new QR Code with the given version number,
  // error correction level, data codeword bytes, and mask number.
  // This is a low-level API that most users should not use directly.
  // A mid-level API is the encodeSegments() function.
  public constructor(
    // The version number of this QR Code, which is between 1 and 40 (inclusive).
    // This determines the size of this barcode.
    public readonly version: number,
    // The error correction level used in this QR Code.
    public readonly errorCorrectionLevel: Ecc,
    dataCodewords: Array<number>,
    // The index of the mask pattern used in this QR Code, which is between 0 and 7 (inclusive).
    // Even if a QR Code is created with automatic masking requested (mask = -1),
    // the resulting object still has a mask value between 0 and 7.
    public readonly mask: number
  ) {

  }

  // Returns the number of data bits that can be stored in a QR Code of the given version number, after
  // all function modules are excluded. This includes remainder bits, so it may not be a multiple of 8.
  // The result is in the range [208, 29648]. This could be implemented as a 40-entry lookup table.
  private static getNumRawDataModules(ver: number) {
    if (ver < QrCode.MIN_VERSION || ver > QrCode.MAX_VERSION)
      throw new Error('Version number out of range');

    let result = (16 * ver + 128) * ver + 64;

    if (ver >= 2) {
      const numAlign = Math.floor(ver / 2) + 2;
      result -= (25 * numAlign - 10) * numAlign - 55;

      if (ver >= 7)
        result -= 36;
    }

    if (!(208 <= result && result <= 29648))
      throw new Error('Assertion error');

    return result;
  }

  // Returns the number of 8-bit data (i.e. not error correction) codewords contained in any
  // QR Code of the given version number and error correction level, with remainder bits discarded.
  // This stateless pure function could be implemented as a (40*4)-cell lookup table.
  private static getNumDataCodewords = (ver: number, ecl: Ecc) =>
    Math.floor(QrCode.getNumRawDataModules(ver) / 8) -
      QrCode.ECC_CODEWORDS_PER_BLOCK[ecl.ordinal][ver] *
      QrCode.NUM_ERROR_CORRECTION_BLOCKS[ecl.ordinal][ver];


  // Returns a Reed-Solomon ECC generator polynomial for the given degree. This could be
  // implemented as a lookup table over all possible parameter values, instead of as an algorithm.
  private static reedSolomonComputeDivisor(degree: number) {
    if (degree < 1 || degree > 255)
      throw new Error('Degree out of range');

    // Polynomial coefficients are stored from highest to lowest power, excluding the leading term which is always 1.
    // For example the polynomial x^3 + 255^2 + 8x + 93 is stored as the uint8 array [255, 8, 93].
    const result: Array<number> = [];

    for (let i = 0; i < degree - 1; i++)
      result.push(0);

    result.push(1); // Start off with the monomial x^0

    // Compute the product polynomial (x - r^0) * (x - r^1) * (x - r^2) * ... * (x - r^{degree - 1}),
    // and drop the highest monomial term which is always 1x^degree.
    // Note that r = 0x02, which is a generator element of this field GF(2^8/0x11D).
    let root = 1;
    for (let i = 0; i < degree; i++) {
      // Multiply the current product by (x - r^i)
      for (let j = 0; j < result.length; j++) {
        result[j] = this.reedSolomonMultiply(result[j], root);
        if (j + 1 < result.length)
          result[j] ^= result[j + 1];
      }
      root = this.reedSolomonMultiply(root, 0x02);
    }

    return result;
  }

  // Returns the Reed-Solomon error correction codeword for the given data and divisor polynomials.
  private static reedSolomonComputeRemainder(data: Array<number>, divisor: Array<number>) {
    const result: Array<number> = divisor.map(_ => 0);

    for (const b of data) { // Polynomial division
      const factor = b ^ (result.shift());
      result.push(0);
      divisor.forEach((coef, i) =>
        result[i] ^= this.reedSolomonMultiply(coef, factor)
      );
    }

    return result;
  }

  // Returns the product of the two given field elements modulo GF(2^8/0x11D). The arguments and result
  // are unsigned 8-bit integers. This could be implemented as a lookup table of 256*256 entries of unit8.
  private static reedSolomonMultiply(x: number, y: number) {
    if (x >>> 8 !== 0 || y >>> 8 !== 0)
      throw new Error('Byte out of range');
    // Russian peasant multiplication
    let z = 0;
    for (let i = 7; i >= 0; i--) {
      z = (z << 1) ^ ((z >>> 7) * 0x11D);
      z ^= ((y >>> i) & 1) * x;
    }

    if (z >>> 8 !== 0)
      throw new Error('Assertion error');

    return z;
  }

  // Returns a QR Code representing the given Unicode text string at the given error correction level.
  // As a conservative upper bound, this function is guaranteed to succeed for strings that have 738 or fewer
  // Unicode code points (not UTF-16 code units) if the low error correction level is used. The smallest possible
  // QR Code version is automatically chosen for the output. The ECC level of the result may be higher than the
  // ecl argument if it can be done without increasing the version.
  public static encodeText(text: string, ecl: Ecc): QrCode {
    const segs = QrSegment.makeSegments(text);
    return QrCode.encodeSegments(segs, ecl);
  }

  // Returns a QR Code representing the given binary data at the given error correction level.
  // This function always encodes using the binary segment mode, not any text mode. The maximum number of
  // bytes allowed is 2953. The smallest possible QR Code version is automatically chosen for the output.
  // The ECC level of the result may be higher than the ecl argument if it can be done without increasing the version.
  public static encodeBinary(data: Array<number>, ecl: Ecc): QrCode {
    const seg = QrSegment.makeBytes(data);
    return QrCode.encodeSegments([seg], ecl);
  }

  // Returns a QR Code representing the given segments with the given encoding parameters.
  // The smallest possible QR Code version within the given range is automatically
  // chosen for the output. If boostEcl is true, then the ECC level of the result
  // may be higher than the ecl argument if it can be done wihtout increasing the
  // version. The mask number is either between 0 to 7 (inclusive) to force that
  // mask, or -1 to automatically choose an appropriate mask (which may be slow).
  // This function allows the user to create a custom sequence of segments that switches
  // between modes (such as alphanumeric and byte) to encode text in less space.
  // This is a mid-level API; the high-level API is encodeText() and encodeBinary().
  public static encodeSegments(
    segs: Array<QrSegment>,
    ecl: Ecc,
    minVersion = 1,
    maxVersion = 40,
    mask = -1,
    boostEcl = true
  ): QrCode {
    if (!(QrCode.MIN_VERSION <= minVersion && minVersion <= maxVersion && maxVersion <= QrCode.MAX_VERSION) || mask < -1 || mask > 7)
      throw new Error('Invalid value');

    // Find the minimal version number to use
    let version: number;
    let dataUsedBits: number;

    for (version = minVersion; ; version++) {
      const dcb = QrCode.getNumDataCodewords(version, ecl) * 8; // Number of data bits available (data capacity bits)
      const usedBits = QrSegment.getTotalBits(segs, version);

      if (usedBits <= dcb) {
        dataUsedBits = usedBits;
        break; // This version numbers is found to be suitable
      }

      if (version >= maxVersion) // All version in the range could not fit the given data
        throw new Error('Data too long');
    }

    // Increase the error correction level while the data still fits in the current version number
    for (const newEcl of [Ecc.MEDIUM, Ecc.QUANTILE, Ecc.HIGH]) { // From low to high
      if (boostEcl && dataUsedBits <= QrCode.getNumDataCodewords(version, newEcl) * 8)
        ecl = newEcl;
    }

    // Concatenate all segments to create the data bit string
    const bb: Array<number> = [];
    for (const seg of segs) {
      QrSegment.appendBits(seg.mode.modeBits, 4, bb);
      QrSegment.appendBits(seg.numChars, seg.mode.numCharCountBits(version), bb);

      for (const b of seg.getData())
        bb.push(b);
    }

    if (bb.length !== dataUsedBits)
      throw new Error('Assertion error');

    // Add terminator and padd up to a byte if applicable
    const dataCapacityBits = QrCode.getNumDataCodewords(version, ecl) * 8;

    if (bb.length > dataCapacityBits)
      throw new Error('Assertion error');

    QrSegment.appendBits(0, Math.min(4, dataCapacityBits - bb.length), bb);
    QrSegment.appendBits(0, (8 - bb.length % 8) % 8, bb);

    if (bb.length % 8 !== 0)
      throw new Error('Assertion error');

    // Pad with alternating bytes until data capacity is reached
    for (let padByte = 0xEC; bb.length < dataCapacityBits; padByte ^= 0xEC ^ 0x11)
      QrSegment.appendBits(padByte, 8, bb);

    // Pack bits into bytes in big endian
    const dataCodewords: Array<number> = [];

    while (dataCodewords.length * 8 < bb.length)
      dataCodewords.push(0);

    bb.forEach((b: number, i: number) =>
      dataCodewords[i >>> 3] |= b << (7 - (i & 7))
    );

    return new QrCode(version, ecl, dataCodewords, mask);
  }

  private drawFunctionPatterns() {
    // Draw horizontal and vertical timing patterns
    for (let i = 0; i < this.size; i++) {
      this.setFunctionModule(6, i, i % 2 === 0);
      this.setFunctionModule(i, 6, i % 2 === 0);
    }

    // Draw 3 finder patterns (all corners except bottom right; overwrites some timing modules)
    this.drawFinderPattern(3, 3);
    this.drawFinderPattern(this.size - 4, 3);
    this.drawFinderPattern(3, this.size - 4);

    // Draw numerous alignment patterns
    const alignPatPos = this.getAlignmentPatternPositions();
    const numAlign = alignPatPos.length;
    for (let i = 0; i < numAlign; i++) {
      for (let j = 0; j < numAlign; j++) {
        // Don't draw on the three finder corners
        if (!(i === 0 && j === 0 || i === 0 && j === numAlign - 1 || i === numAlign - 1 && j === 0))
          this.drawAlignmentPattern(alignPatPos[i], alignPatPos[j]);
      }
    }

    // Draw configuration data;
    this.drawFormatBits(0); // Dummy mask value; overwritten later in the constructor
    this.drawVersion();
  }

  // Draws two copies of the format bits (with its own error correction code)
  // based on the given mask and this object's error correction level field.
  private drawFormatBits(mask: number) {
    // Calculate error correction code and pack bits
    const data = this.errorCorrectionLevel.formatBits << 3 | mask; // errCorrLvl is uint2, mask is uint3
    let rem = data;

    for (let i = 0; i < 10; i++)
      rem = (rem << 1) ^ ((rem >>> 9) * 0x537);

    const bits = (data << 10 | rem) ^ 0x5412; // uint15

    if (bits >>> 15 !== 0)
      throw new Error('Assertion error');

    // Draw first copy
    for (let i = 0; i <= 5; i++)
      this.setFunctionModule(8, i, QrSegment.getBit(bits, i));

    this.setFunctionModule(8, 7, QrSegment.getBit(bits, 6));
    this.setFunctionModule(8, 8, QrSegment.getBit(bits, 7));
    this.setFunctionModule(7, 8, QrSegment.getBit(bits, 8));

    for (let i = 9; i < 15; i++)
      this.setFunctionModule(14 - i, 8, QrSegment.getBit(bits, i));

    // Draw second copy
    for (let i = 0; i < 8; i++)
      this.setFunctionModule(this.size - 1 - i, 8, QrSegment.getBit(bits, i));

    for (let i = 8; i < 15; i++)
      this.setFunctionModule(8, this.size - 15 + i, QrSegment.getBit(bits, i));

    this.setFunctionModule(8, this.size - 8, true); // Always black
  }

  // Draws two copies of the version bits (with its own error correction code),
  // based on this object's version field, if 7 <= version <= 40.
  private drawVersion() {
    if (this.version < 7)
      return;

    // Calculate error correction code and pack bits
    let rem = this.version; // version is unit6, in the range [7, 40]

    for (let i = 0; i < 12; i++)
      rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);

    const bits = this.version << 12 | rem; // unit18

    if (bits >>> 18 !== 0)
      throw new Error('Assertion error');

    // Draw two copies
    for (let i = 0; i < 18; i++) {
      const color = QrSegment.getBit(bits, i);
      const a = this.size - 11 + i % 3;
      const b = Math.floor(i / 3);
      this.setFunctionModule(a, b, color);
      this.setFunctionModule(b, a, color);
    }
  }

  // Draws a 9*9 finder pattern including the border separator,
  // with the center module at (x, y). Modules can be out of bounds.
  private drawFinderPattern(x: number, y: number) {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const dist = Math.max(Math.abs(dx), Math.abs(dy)); // Chebyshev / infininty norm
        const xx = x + dx;
        const yy = y + dy;
        if (0 <= xx && xx < this.size && 0 <= yy && yy < this.size)
          this.setFunctionModule(xx, yy, dist !== 2 && dist !== 4);
      }
    }
  }

  // Draws a 5*5 alignment pattern, with the center module
  // at (x, y). All modules must be in bounds.
  private drawAlignmentPattern(x: number, y: number) {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++)
        this.setFunctionModule(x + dx, y + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }
  }

  // Sets the color of a module and marks it as a function module.
  // Only used by the constructor. Coordinates must be in bounds.
  private setFunctionModule(x: number, y: number, isBlack: boolean) {
    this.modules[y][x] = isBlack;
    this.isFunction[y][x] = true;
  }

  // Returns a new byte string representing the given data with the appropriate error correction
  // codewords appended to it, based on this object's version and error correction level.
  private addEccAndInterleave(data: Array<number>) {
    const ver = this.version;
    const ecl = this.errorCorrectionLevel;

    if (data.length !== QrCode.getNumDataCodewords(ver, ecl))
      throw new Error('Invalid argument');

    // Calculate parameter numbers
    const numBlocks = QrCode.NUM_ERROR_CORRECTION_BLOCKS[ecl.ordinal][ver];
    const blockEccLen = QrCode.ECC_CODEWORDS_PER_BLOCK[ecl.ordinal][ver];
    const rawCodewords = Math.floor(QrCode.getNumRawDataModules(ver) / 8);
    const numShortBlocks = numBlocks - rawCodewords % numBlocks;
    const shortBlockLen = Math.floor(rawCodewords / numBlocks);

    // Split data into blocks and append ECC to each block
    const blocks: Array<Array<number>> = [];
    const rsDiv = QrCode.reedSolomonComputeDivisor(blockEccLen);
    for (let i = 0, k = 0; i < numBlocks; i++) {
      const dat = data.slice(k, k + shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1));
      k += dat.length;
      const ecc = QrCode.reedSolomonComputeRemainder(dat, rsDiv);

      if (i < numShortBlocks)
        dat.push(0);

      blocks.push(dat.concat(ecc));
    }

    // Interleave (not concatenate) the bytes from every block into a single sequence
    const result: Array<number> = [];
    for (let i = 0; i < blocks[0].length; i++) {
      blocks.forEach((block, j) => {
        // Skip the padding byte in short blocks
        if (i !== shortBlockLen - blockEccLen || j >= numShortBlocks)
          result.push(block[i]);
      });
    }
    if (result.length !== rawCodewords)
      throw new Error('Assertion error');

    return result;
  }

  // Draws the given sequence of 8-bit codewords (data and error correction) onto the entire
  // data area of this QR code. Function modules need to be marked off before this is called.
  private drawCodewords(data: Array<number>) {
    if (data.length !== Math.floor(QrCode.getNumRawDataModules(this.version) / 8))
      throw new Error('Invalid argument');

    let i = 0; // Bit index into the data

    // Do the funny zigzag scan
    for (let right = this.size - 1; right >= 1; right -= 2) { // Index of right column in each column pair
      if (right === 6)
        right = 5;

      for (let vert = 0; vert < this.size; vert++) { // Vertical counter
        for (let j = 0; j < 2; j++) {
          const x = right - j; // Actual x coordinate
          const upward = ((right + 1) & 2) === 0;
          const y = upward ? this.size - 1 - vert : vert; // Actual y coordinate
          if (!this.isFunction[y][x] && i < data.length * 8) {
            this.modules[y][x] = QrSegment.getBit(data[i >>> 3], 7 - (i & 7));
            i++;
          }

          // If this QR Code has any remainder bits (0 to 7), they were assigned as
          // 0/false/white by the constructor and are left unchanged by this method
        }
      }
    }

    if (i !== data.length * 8)
      throw new Error('Assertion error');
  }

  // XORs the codeword modules in this QR Code with the given mask pattern.
  // The function modules must be marked and the codeword bits must be drawn
  // before masking. Due to the arithmetic of XOR, calling applyMask() with
  // the same value a second time will undo the mask. A final well-formed
  // QR Code needs exactly one (not zero, two, etc.) mask applied.
  private applyMask(mask: number) {
    if (mask < 0 || mask > 7)
      throw new Error('Mask value out of range');

    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        let invert: boolean;
        switch (mask) {
          case 0:
            invert = (x + y) % 2 === 0;
            break;
          case 1:
            invert = y % 2 === 0;
            break;
          case 2:
            invert = x % 3 === 0;
            break;
          case 3:
            invert = (x + y) % 3 === 0;
            break;
          case 4:
            invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
            break;
          case 5:
            invert = x * y % 2 + x * y % 3 === 0;
            break;
          case 6:
            invert = (x * y % 2 + x * y % 3) % 2 === 0;
            break;
          case 7:
            invert = ((x + y) % 2 + x * y % 3) % 2 === 0;
            break;
          default:
            throw new Error('Assertion error');
        }

        if (!this.isFunction[y][x] && invert)
          this.modules[y][x] = !this.modules[y][x];
      }
    }
  }

  // Returns an ascending list of positions of alignment patterns for this version number.
  // Each position is in the range [0, 177) and are used on both the x and y axes.
  // This could be implemented as lookup table of 40 variable-length lists of integers.
  private getAlignmentPatternPositions(): Array<number> {
    if (this.version === 1)
      return [];
    else {
      const numAlign = Math.floor(this.version / 7) + 2;
      const step = (this.version === 32)
        ? 26
        : Math.ceil((this.size - 13) / (numAlign * 2 - 2)) * 2;

      const result = [6];

      for (let pos = this.size - 7; result.length < numAlign; pos -= step)
        result.splice(1, 0, pos);

      return result;
    }
  }

  // Calculates and returns the penalty score based on state of this QR Code's current modules.
  // This is used by the automatic mask choice algorithm to find the mask pattern that yields the lowest score.
  private getPenaltyScore() {
    let result = 0;

    // Adjacent modules in row having same color, and finder-like patterns
    for (let y = 0; y < this.size; y++) {
      const runHistory = [0, 0, 0, 0, 0, 0, 0];
      let runColor = false;
      let runX = 0;

      for (let x = 0; x < this.size; x++) {
        if (this.modules[y][x] === runColor) {
          runX++;
          if (runX === 5)
            result += QrCode.PENALTY_N1;
          else if (runX > 5)
            result++;
        } else {
          this.finderPenaltyAddHistory(runX, runHistory);
          if (!runColor)
            result += this.finderPenaltyCountPatterns(runHistory) * QrCode.PENALTY_N3;
          runColor = this.modules[y][x];
          runX = 1;
        }
      }

      result += this.finderPenaltyTerminateAndCount(runColor, runX, runHistory) * QrCode.PENALTY_N3;
    }

    // Adjacent modules in column having same color, and finder-like patterns
    for (let x = 0; x < this.size; x++) {
      const runHistory = [0, 0, 0, 0, 0, 0, 0];
      let runColor = false;
      let runY = 0;

      for (let y = 0; y < this.size; y++) {
        if (this.modules[y][x] === runColor) {
          runY++;
          if (runY === 5)
            result += QrCode.PENALTY_N1;
          else if (runY > 5)
            result++;
        } else {
          this.finderPenaltyAddHistory(runY, runHistory);
          if (!runColor)
            result += this.finderPenaltyCountPatterns(runHistory) * QrCode.PENALTY_N3;
            runColor = this.modules[y][x];
            runY = 1;
        }
      }

      result += this.finderPenaltyTerminateAndCount(runColor, runY, runHistory) * QrCode.PENALTY_N3;
    }

    // 2*2 blocks of moudles having same color
    for (let y = 0; y < this.size - 1; y++) {
      for (let x = 0; x < this.size - 1; x++) {
        const color = this.modules[y][x];

        if (
          color === this.modules[y][x + 1] &&
          color === this.modules[y + 1][x] &&
          color === this.modules[y + 1][x + 1]
        )
          result += QrCode.PENALTY_N2;
      }
    }

    // Balance of black and white modules
    let black = 0;
    for (const row of this.modules)
      black = row.reduce((sum, color) => sum + (color ? 1 : 0), black);

    const total = this.size * this.size; // Note that size is odd, so black / total != 1/2
    const k = Math.ceil(Math.abs(black * 20 - total * 10) / total) - 1;
    result += k * QrCode.PENALTY_N4;

    return result;
  }

  // Must be called at the end of a line (row or column) of modules. A helper function for getPenaltyScore().
  private finderPenaltyTerminateAndCount(currentRunColor: boolean, currentRunLength: number, runHistory: Array<number>) {
    if (currentRunColor) { // Terminate black ru n
      this.finderPenaltyAddHistory(currentRunLength, runHistory);
      currentRunLength = 0;
    }
    currentRunLength += this.size; // Add a white border to final run
    this.finderPenaltyAddHistory(currentRunLength, runHistory);

    return this.finderPenaltyCountPatterns(runHistory);
  }

  // Can only be called immediately after a white run is added, and
  // returns either 0, 1, or 2. A helper function for getPenaltyScore().
  private finderPenaltyCountPatterns(runHistory: Array<number>) {
    const n: number = runHistory[1];

    if (n > this.size * 3)
      throw new Error('Assertion error');

    const core: boolean = n > 0 && runHistory[2] === n && runHistory[3] === n * 3 && runHistory[4] === n && runHistory[5] === n;

    return (core && runHistory[0] >= n * 4 && runHistory[6] >= n ? 1 : 0)
      + (core && runHistory[6] >= n * 4 && runHistory[0] >= n ? 1 : 0);
  }

  // Pushes the given value to the front and drops the last value. A helper function for getPenaltyScore().
  private finderPenaltyAddHistory(currentRunLength: number, runHistory: Array<number>) {
    if (runHistory[0] === 0)
      currentRunLength += this.size; // Add white border to initial run

    runHistory.pop();
    runHistory.unshift(currentRunLength);
  }

  // Returns the color of the module (pixel) at the given coordinates, which is false
  // for white or true for black. The top left corner has the coordinates (x=0, y=0).
  // If the given coordinates are out of bounds, then false (white) is returned.
  public getModule = (x: number, y: number): boolean =>
    0 <= x && x < this.size && 0 <= y && y < this.size && this.modules[y][x];

  // Draws this QR Code, with the given module scale and border modules, onto the given HTML
  // canvas element. The canvas's width and height is resized to (this.size + border * 2) * scale.
  // The drawn image is purely black and white, and fully opaque.
  // The scale must be a positive integer and the border must be a non-negative integer.
  public drawCanvas(scale: number, border: number, canvas: HTMLCanvasElement) {
    if (scale <= 0 || border < 0)
      throw new Error('Value out of range');

    const width = (this.size + border * 2) * scale;
    canvas.width = width;
    canvas.height = width;

    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

    for (let y = -border; y < this.size + border; y++) {
      for (let x = -border; x < this.size + border; x++) {
        ctx.fillStyle = this.getModule(x, y) ? '#000000' : '#ffffff';
        ctx.fillRect((x + border) * scale, (y + border) * scale, scale, scale);
      }
    }
  }

  // Returns a string of SVG code for an image depicting this QR Code, with the given number
  // of border modules. The strung always uses Unix newlines (\n), regardless of the platform.
  public toSvgString(border: number): string {
    if (border < 0)
      throw new Error('Border must be non-negative');
    const parts: Array<string> = [];

    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        if (this.getModule(x, y))
          parts.push(`M${x + border},${y + border}h1v1h-1z`);
      }
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 ${this.size + border * 2} ${this.size + border * 2}" stroke="none">
  <rect width="100%" height="100%" fill="#ffffff" />
  <path d="${parts.join(' ')}" fill="#000000" />
</svg>
`;
  }
}
