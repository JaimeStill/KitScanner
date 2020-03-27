import { DataMask } from './data-mask';
import { FormatInformation } from './format-information';
import { Version } from './version';
import { BitMatrix } from '../../common/bit-matrix';
import { FormatException } from '../../exception/format-exception';

export class BitMatrixParser {
  private bitMatrix: BitMatrix;
  private parsedVersion: Version;
  private parsedFormatInfo: FormatInformation;
  private isMirror: boolean;

  constructor(
    bitMatrix: BitMatrix
  ) {
    const dimension = bitMatrix.getHeight();

    if (dimension < 21 || (dimension & 0x03) !== 1)
      throw new FormatException();

    this.bitMatrix = bitMatrix;
  }

  private copyBit = (i: number, j: number, versionBits: number) => {
    const bit = this.isMirror
      ? this.bitMatrix.get(j, i)
      : this.bitMatrix.get(i, j);

    return bit
      ? (versionBits << 1) | 0x1
      : versionBits << 1;
  }

  readFormatInformation = () => {
    if (this.parsedFormatInfo !== null && this.parsedFormatInfo !== undefined)
      return this.parsedFormatInfo;

    let formatInfoBits1 = 0;

    for (let i = 0; i < 6; i++)
      formatInfoBits1 = this.copyBit(i, 8, formatInfoBits1);

    formatInfoBits1 = this.copyBit(7, 8, formatInfoBits1);
    formatInfoBits1 = this.copyBit(8, 8, formatInfoBits1);
    formatInfoBits1 = this.copyBit(8, 7, formatInfoBits1);

    for (let j = 5; j >= 0; j--)
      formatInfoBits1 = this.copyBit(8, j, formatInfoBits1);

    const dimension = this.bitMatrix.getHeight();
    let formatInfoBits2 = 0;
    const jMin = dimension - 7;

    for (let j = dimension - 1; j >= jMin; j--)
      formatInfoBits2 = this.copyBit(8, j, formatInfoBits2);

    for (let i = dimension - 8; i < dimension; i++)
      formatInfoBits2 = this.copyBit(i, 8, formatInfoBits2);

    this.parsedFormatInfo = FormatInformation.decodeFormatInformation(formatInfoBits1, formatInfoBits2);

    if (this.parsedFormatInfo !== null)
      return this.parsedFormatInfo;

    throw new FormatException();
  }

  readVersion = () => {
    if (this.parsedVersion !== null && this.parsedVersion !== undefined)
      return this.parsedVersion;

    const dimension = this.bitMatrix.getHeight();

    const provisionalVersion = Math.floor((dimension - 17) / 4);

    if (provisionalVersion <= 6)
      return Version.getVersionForNumber(provisionalVersion);

    let versionBits = 0;
    const ijMin = dimension - 11;

    for (let j = 5; j >= 0; j--)
      for (let i = dimension - 9; i >= ijMin; i--)
        versionBits = this.copyBit(i, j, versionBits);

    let theParsedVersion = Version.decodeVersionInformation(versionBits);

    if (theParsedVersion !== null && theParsedVersion.getDimensionForVersion() === dimension) {
      this.parsedVersion = theParsedVersion;
      return theParsedVersion;
    }

    versionBits = 0;

    for (let i = 5; i >= 0; i--)
      for (let j = dimension - 9; j >= ijMin; j--)
        versionBits = this.copyBit(i, j, versionBits);

    theParsedVersion = Version.decodeVersionInformation(versionBits);

    if (theParsedVersion !== null && theParsedVersion.getDimensionForVersion() === dimension) {
      this.parsedVersion = theParsedVersion;
      return theParsedVersion;
    }

    throw new FormatException();
  }

  readCodewords = () => {
    const formatInfo = this.readFormatInformation();
    const version = this.readVersion();

    const dataMask = DataMask.values.get(formatInfo.getDataMask());
    const dimension = this.bitMatrix.getHeight();
    dataMask.unmaskBitMatrix(this.bitMatrix, dimension);

    const functionPattern = version.buildFunctionPattern();

    let readingUp = true;
    const result = new Uint8Array(version.getTotalCodewords());
    let resultOffset = 0;
    let currentByte = 0;
    let bitsRead = 0;

    for (let j = dimension - 1; j > 0; j -= 2) {
      if (j === 6)
        j--;

      for (let count = 0; count < dimension; count++) {
        const i = readingUp
          ? dimension - 1 - count
          : count;

        for (let col = 0; col < 2; col++) {
          if (!functionPattern.get(j - col, i)) {
            bitsRead++;
            currentByte <<= 1;

            if (this.bitMatrix.get(j - col, i))
              currentByte |= 1;

            if (bitsRead === 8) {
              result[resultOffset++] = currentByte;
              bitsRead = 0;
              currentByte = 0;
            }
          }
        }
      }

      readingUp = !readingUp;
    }

    if (resultOffset !== version.getTotalCodewords())
      throw new FormatException();

    return result;
  }

  remask = () => {
    if (this.parsedFormatInfo === null)
      return;

    const dataMask = DataMask.values[this.parsedFormatInfo.getDataMask()];
    const dimension = this.bitMatrix.getHeight();
    dataMask.unmaskBitMatrix(this.bitMatrix, dimension);
  }

  setMirror = (isMirror: boolean) => {
    this.parsedVersion = null;
    this.parsedFormatInfo = null;
    this.isMirror = isMirror;
  }

  public mirror = () => {
    const bitMatrix = this.bitMatrix;

    for (let x = 0, width = bitMatrix.getWidth(); x < width; x++)
      for (let y = x + 1, height = bitMatrix.getHeight(); y < height; y++)
        if (bitMatrix.get(x, y) !== bitMatrix.get(y, x)) {
          bitMatrix.flip(y, x);
          bitMatrix.flip(x, y);
        }
  }
}
