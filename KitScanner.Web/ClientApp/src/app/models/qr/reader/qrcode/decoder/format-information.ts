import { ErrorCorrectionLevel } from './error-correction-level';
import { Integer } from '../../util/integer';

export class FormatInformation {
  private static FORMAT_INFO_MASK_QR = 0x5412;

  private static FORMAT_INFO_DECODE_LOOKUP = [
    Int32Array.from([0x5412, 0x00]),
    Int32Array.from([0x5125, 0x01]),
    Int32Array.from([0x5E7C, 0x02]),
    Int32Array.from([0x5B4B, 0x03]),
    Int32Array.from([0x45F9, 0x04]),
    Int32Array.from([0x40CE, 0x05]),
    Int32Array.from([0x4F97, 0x06]),
    Int32Array.from([0x4AA0, 0x07]),
    Int32Array.from([0x77C4, 0x08]),
    Int32Array.from([0x72F3, 0x09]),
    Int32Array.from([0x7DAA, 0x0A]),
    Int32Array.from([0x789D, 0x0B]),
    Int32Array.from([0x662F, 0x0C]),
    Int32Array.from([0x6318, 0x0D]),
    Int32Array.from([0x6C41, 0x0E]),
    Int32Array.from([0x6976, 0x0F]),
    Int32Array.from([0x1689, 0x10]),
    Int32Array.from([0x13BE, 0x11]),
    Int32Array.from([0x1CE7, 0x12]),
    Int32Array.from([0x19D0, 0x13]),
    Int32Array.from([0x0762, 0x14]),
    Int32Array.from([0x0255, 0x15]),
    Int32Array.from([0x0D0C, 0x16]),
    Int32Array.from([0x083B, 0x17]),
    Int32Array.from([0x355F, 0x18]),
    Int32Array.from([0x3068, 0x19]),
    Int32Array.from([0x3F31, 0x1A]),
    Int32Array.from([0x3A06, 0x1B]),
    Int32Array.from([0x24B4, 0x1C]),
    Int32Array.from([0x2183, 0x1D]),
    Int32Array.from([0x2EDA, 0x1E]),
    Int32Array.from([0x2BED, 0x1F])
  ];

  private errorCorrectionLevel: ErrorCorrectionLevel;
  private dataMask: number;

  private constructor(
    formatInfo: number
  ) {
    this.errorCorrectionLevel = ErrorCorrectionLevel.forBits((formatInfo >> 3) & 0x03);
    this.dataMask = (formatInfo & 0x07);
  }

  private static doDecodeFormatInformation = (maskedFormatInfo1: number, maskedFormatInfo2: number) => {
    let bestDifference = Number.MAX_SAFE_INTEGER;
    let bestFormatInfo = 0;

    for (const decodeInfo of FormatInformation.FORMAT_INFO_DECODE_LOOKUP) {
      const targetInfo = decodeInfo[0];

      if (targetInfo === maskedFormatInfo1 || targetInfo === maskedFormatInfo2)
        return new FormatInformation(decodeInfo[1]);

      let bitsDifference = FormatInformation.numBitsDiffering(maskedFormatInfo1, targetInfo);

      if (bitsDifference < bestDifference) {
        bestFormatInfo = decodeInfo[1];
        bestDifference = bitsDifference;
      }

      if (maskedFormatInfo1 !== maskedFormatInfo2) {
        bitsDifference = FormatInformation.numBitsDiffering(maskedFormatInfo2, targetInfo);

        if (bitsDifference < bestDifference) {
          bestFormatInfo = decodeInfo[1];
          bestDifference = bitsDifference;
        }
      }
    }

    if (bestDifference <= 3)
      return new FormatInformation(bestFormatInfo);

    return null;
  }

  static numBitsDiffering = (a: number, b: number) => Integer.bitCount(a ^ b);

  static decodeFormatInformation = (maskedFormatInfo1: number, maskedFormatInfo2: number) => {
    const formatInfo = FormatInformation.doDecodeFormatInformation(maskedFormatInfo1, maskedFormatInfo2);

    if (formatInfo !== null)
      return formatInfo;

    return FormatInformation.doDecodeFormatInformation(
      maskedFormatInfo1 ^ FormatInformation.FORMAT_INFO_MASK_QR,
      maskedFormatInfo2 ^ FormatInformation.FORMAT_INFO_MASK_QR
    );
  }

  getErrorCorrectionLevel = () => this.errorCorrectionLevel;
  getDataMask = () => this.dataMask;
  hashCode = () => (this.errorCorrectionLevel.getBits() << 3) | this.dataMask;

  equals = (o: Object) => {
    if (!(o instanceof FormatInformation))
      return false;

    const other = <FormatInformation>o;

    return this.errorCorrectionLevel === other.errorCorrectionLevel &&
      this.dataMask === other.dataMask;
  }
}
