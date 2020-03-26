import { EcBlocks } from './ec-blocks';
import { Ecb } from './ecb';
import { ErrorCorrectionLevel } from './error-correction-level';
import { FormatInformation } from './format-information';
import { BitMatrix } from '../../common/bit-matrix';
import { FormatException } from '../../exception/format-exception';
import { IllegalArgumentException } from '../../exception/illegal-argument-exception';

export class Version {
  private static VERSION_DECODE_INFO = Int32Array.from([
    0x07C94, 0x085BC, 0x09A99, 0x0A4D3, 0x0BBF6,
    0x0C762, 0x0D847, 0x0E60D, 0x0F928, 0x10B78,
    0x1145D, 0x12A17, 0x13532, 0x149A6, 0x15683,
    0x168C9, 0x177EC, 0x18EC4, 0x191E1, 0x1AFAB,
    0x1B08E, 0x1CC1A, 0x1D33F, 0x1ED75, 0x1F250,
    0x209D5, 0x216F0, 0x228BA, 0x2379F, 0x24B0B,
    0x2542E, 0x26A64, 0x27541, 0x28C69
  ]);

  private static VERSIONS: Version[] = [
    new Version(1, new Int32Array(0),
      new EcBlocks(7, new Ecb(1, 19)),
      new EcBlocks(10, new Ecb(1, 16)),
      new EcBlocks(13, new Ecb(1, 13)),
      new EcBlocks(17, new Ecb(1, 9))),
    new Version(2, Int32Array.from([6, 18]),
      new EcBlocks(10, new Ecb(1, 34)),
      new EcBlocks(16, new Ecb(1, 28)),
      new EcBlocks(22, new Ecb(1, 22)),
      new EcBlocks(28, new Ecb(1, 16))),
    new Version(3, Int32Array.from([6, 22]),
      new EcBlocks(15, new Ecb(1, 55)),
      new EcBlocks(26, new Ecb(1, 44)),
      new EcBlocks(18, new Ecb(2, 17)),
      new EcBlocks(22, new Ecb(2, 13))),
    new Version(4, Int32Array.from([6, 26]),
      new EcBlocks(20, new Ecb(1, 80)),
      new EcBlocks(18, new Ecb(2, 32)),
      new EcBlocks(26, new Ecb(2, 24)),
      new EcBlocks(16, new Ecb(4, 9))),
    new Version(5, Int32Array.from([6, 30]),
      new EcBlocks(26, new Ecb(1, 108)),
      new EcBlocks(24, new Ecb(2, 43)),
      new EcBlocks(18, new Ecb(2, 15),
        new Ecb(2, 16)),
      new EcBlocks(22, new Ecb(2, 11),
        new Ecb(2, 12))),
    new Version(6, Int32Array.from([6, 34]),
      new EcBlocks(18, new Ecb(2, 68)),
      new EcBlocks(16, new Ecb(4, 27)),
      new EcBlocks(24, new Ecb(4, 19)),
      new EcBlocks(28, new Ecb(4, 15))),
    new Version(7, Int32Array.from([6, 22, 38]),
      new EcBlocks(20, new Ecb(2, 78)),
      new EcBlocks(18, new Ecb(4, 31)),
      new EcBlocks(18, new Ecb(2, 14),
        new Ecb(4, 15)),
      new EcBlocks(26, new Ecb(4, 13),
        new Ecb(1, 14))),
    new Version(8, Int32Array.from([6, 24, 42]),
      new EcBlocks(24, new Ecb(2, 97)),
      new EcBlocks(22, new Ecb(2, 38),
        new Ecb(2, 39)),
      new EcBlocks(22, new Ecb(4, 18),
        new Ecb(2, 19)),
      new EcBlocks(26, new Ecb(4, 14),
        new Ecb(2, 15))),
    new Version(9, Int32Array.from([6, 26, 46]),
      new EcBlocks(30, new Ecb(2, 116)),
      new EcBlocks(22, new Ecb(3, 36),
        new Ecb(2, 37)),
      new EcBlocks(20, new Ecb(4, 16),
        new Ecb(4, 17)),
      new EcBlocks(24, new Ecb(4, 12),
        new Ecb(4, 13))),
    new Version(10, Int32Array.from([6, 28, 50]),
      new EcBlocks(18, new Ecb(2, 68),
        new Ecb(2, 69)),
      new EcBlocks(26, new Ecb(4, 43),
        new Ecb(1, 44)),
      new EcBlocks(24, new Ecb(6, 19),
        new Ecb(2, 20)),
      new EcBlocks(28, new Ecb(6, 15),
        new Ecb(2, 16))),
    new Version(11, Int32Array.from([6, 30, 54]),
      new EcBlocks(20, new Ecb(4, 81)),
      new EcBlocks(30, new Ecb(1, 50),
        new Ecb(4, 51)),
      new EcBlocks(28, new Ecb(4, 22),
        new Ecb(4, 23)),
      new EcBlocks(24, new Ecb(3, 12),
        new Ecb(8, 13))),
    new Version(12, Int32Array.from([6, 32, 58]),
      new EcBlocks(24, new Ecb(2, 92),
        new Ecb(2, 93)),
      new EcBlocks(22, new Ecb(6, 36),
        new Ecb(2, 37)),
      new EcBlocks(26, new Ecb(4, 20),
        new Ecb(6, 21)),
      new EcBlocks(28, new Ecb(7, 14),
        new Ecb(4, 15))),
    new Version(13, Int32Array.from([6, 34, 62]),
      new EcBlocks(26, new Ecb(4, 107)),
      new EcBlocks(22, new Ecb(8, 37),
        new Ecb(1, 38)),
      new EcBlocks(24, new Ecb(8, 20),
        new Ecb(4, 21)),
      new EcBlocks(22, new Ecb(12, 11),
        new Ecb(4, 12))),
    new Version(14, Int32Array.from([6, 26, 46, 66]),
      new EcBlocks(30, new Ecb(3, 115),
        new Ecb(1, 116)),
      new EcBlocks(24, new Ecb(4, 40),
        new Ecb(5, 41)),
      new EcBlocks(20, new Ecb(11, 16),
        new Ecb(5, 17)),
      new EcBlocks(24, new Ecb(11, 12),
        new Ecb(5, 13))),
    new Version(15, Int32Array.from([6, 26, 48, 70]),
      new EcBlocks(22, new Ecb(5, 87),
        new Ecb(1, 88)),
      new EcBlocks(24, new Ecb(5, 41),
        new Ecb(5, 42)),
      new EcBlocks(30, new Ecb(5, 24),
        new Ecb(7, 25)),
      new EcBlocks(24, new Ecb(11, 12),
        new Ecb(7, 13))),
    new Version(16, Int32Array.from([6, 26, 50, 74]),
      new EcBlocks(24, new Ecb(5, 98),
        new Ecb(1, 99)),
      new EcBlocks(28, new Ecb(7, 45),
        new Ecb(3, 46)),
      new EcBlocks(24, new Ecb(15, 19),
        new Ecb(2, 20)),
      new EcBlocks(30, new Ecb(3, 15),
        new Ecb(13, 16))),
    new Version(17, Int32Array.from([6, 30, 54, 78]),
      new EcBlocks(28, new Ecb(1, 107),
        new Ecb(5, 108)),
      new EcBlocks(28, new Ecb(10, 46),
        new Ecb(1, 47)),
      new EcBlocks(28, new Ecb(1, 22),
        new Ecb(15, 23)),
      new EcBlocks(28, new Ecb(2, 14),
        new Ecb(17, 15))),
    new Version(18, Int32Array.from([6, 30, 56, 82]),
      new EcBlocks(30, new Ecb(5, 120),
        new Ecb(1, 121)),
      new EcBlocks(26, new Ecb(9, 43),
        new Ecb(4, 44)),
      new EcBlocks(28, new Ecb(17, 22),
        new Ecb(1, 23)),
      new EcBlocks(28, new Ecb(2, 14),
        new Ecb(19, 15))),
    new Version(19, Int32Array.from([6, 30, 58, 86]),
      new EcBlocks(28, new Ecb(3, 113),
        new Ecb(4, 114)),
      new EcBlocks(26, new Ecb(3, 44),
        new Ecb(11, 45)),
      new EcBlocks(26, new Ecb(17, 21),
        new Ecb(4, 22)),
      new EcBlocks(26, new Ecb(9, 13),
        new Ecb(16, 14))),
    new Version(20, Int32Array.from([6, 34, 62, 90]),
      new EcBlocks(28, new Ecb(3, 107),
        new Ecb(5, 108)),
      new EcBlocks(26, new Ecb(3, 41),
        new Ecb(13, 42)),
      new EcBlocks(30, new Ecb(15, 24),
        new Ecb(5, 25)),
      new EcBlocks(28, new Ecb(15, 15),
        new Ecb(10, 16))),
    new Version(21, Int32Array.from([6, 28, 50, 72, 94]),
      new EcBlocks(28, new Ecb(4, 116),
        new Ecb(4, 117)),
      new EcBlocks(26, new Ecb(17, 42)),
      new EcBlocks(28, new Ecb(17, 22),
        new Ecb(6, 23)),
      new EcBlocks(30, new Ecb(19, 16),
        new Ecb(6, 17))),
    new Version(22, Int32Array.from([6, 26, 50, 74, 98]),
      new EcBlocks(28, new Ecb(2, 111),
        new Ecb(7, 112)),
      new EcBlocks(28, new Ecb(17, 46)),
      new EcBlocks(30, new Ecb(7, 24),
        new Ecb(16, 25)),
      new EcBlocks(24, new Ecb(34, 13))),
    new Version(23, Int32Array.from([6, 30, 54, 78, 102]),
      new EcBlocks(30, new Ecb(4, 121),
        new Ecb(5, 122)),
      new EcBlocks(28, new Ecb(4, 47),
        new Ecb(14, 48)),
      new EcBlocks(30, new Ecb(11, 24),
        new Ecb(14, 25)),
      new EcBlocks(30, new Ecb(16, 15),
        new Ecb(14, 16))),
    new Version(24, Int32Array.from([6, 28, 54, 80, 106]),
      new EcBlocks(30, new Ecb(6, 117),
        new Ecb(4, 118)),
      new EcBlocks(28, new Ecb(6, 45),
        new Ecb(14, 46)),
      new EcBlocks(30, new Ecb(11, 24),
        new Ecb(16, 25)),
      new EcBlocks(30, new Ecb(30, 16),
        new Ecb(2, 17))),
    new Version(25, Int32Array.from([6, 32, 58, 84, 110]),
      new EcBlocks(26, new Ecb(8, 106),
        new Ecb(4, 107)),
      new EcBlocks(28, new Ecb(8, 47),
        new Ecb(13, 48)),
      new EcBlocks(30, new Ecb(7, 24),
        new Ecb(22, 25)),
      new EcBlocks(30, new Ecb(22, 15),
        new Ecb(13, 16))),
    new Version(26, Int32Array.from([6, 30, 58, 86, 114]),
      new EcBlocks(28, new Ecb(10, 114),
        new Ecb(2, 115)),
      new EcBlocks(28, new Ecb(19, 46),
        new Ecb(4, 47)),
      new EcBlocks(28, new Ecb(28, 22),
        new Ecb(6, 23)),
      new EcBlocks(30, new Ecb(33, 16),
        new Ecb(4, 17))),
    new Version(27, Int32Array.from([6, 34, 62, 90, 118]),
      new EcBlocks(30, new Ecb(8, 122),
        new Ecb(4, 123)),
      new EcBlocks(28, new Ecb(22, 45),
        new Ecb(3, 46)),
      new EcBlocks(30, new Ecb(8, 23),
        new Ecb(26, 24)),
      new EcBlocks(30, new Ecb(12, 15),
        new Ecb(28, 16))),
    new Version(28, Int32Array.from([6, 26, 50, 74, 98, 122]),
      new EcBlocks(30, new Ecb(3, 117),
        new Ecb(10, 118)),
      new EcBlocks(28, new Ecb(3, 45),
        new Ecb(23, 46)),
      new EcBlocks(30, new Ecb(4, 24),
        new Ecb(31, 25)),
      new EcBlocks(30, new Ecb(11, 15),
        new Ecb(31, 16))),
    new Version(29, Int32Array.from([6, 30, 54, 78, 102, 126]),
      new EcBlocks(30, new Ecb(7, 116),
        new Ecb(7, 117)),
      new EcBlocks(28, new Ecb(21, 45),
        new Ecb(7, 46)),
      new EcBlocks(30, new Ecb(1, 23),
        new Ecb(37, 24)),
      new EcBlocks(30, new Ecb(19, 15),
        new Ecb(26, 16))),
    new Version(30, Int32Array.from([6, 26, 52, 78, 104, 130]),
      new EcBlocks(30, new Ecb(5, 115),
        new Ecb(10, 116)),
      new EcBlocks(28, new Ecb(19, 47),
        new Ecb(10, 48)),
      new EcBlocks(30, new Ecb(15, 24),
        new Ecb(25, 25)),
      new EcBlocks(30, new Ecb(23, 15),
        new Ecb(25, 16))),
    new Version(31, Int32Array.from([6, 30, 56, 82, 108, 134]),
      new EcBlocks(30, new Ecb(13, 115),
        new Ecb(3, 116)),
      new EcBlocks(28, new Ecb(2, 46),
        new Ecb(29, 47)),
      new EcBlocks(30, new Ecb(42, 24),
        new Ecb(1, 25)),
      new EcBlocks(30, new Ecb(23, 15),
        new Ecb(28, 16))),
    new Version(32, Int32Array.from([6, 34, 60, 86, 112, 138]),
      new EcBlocks(30, new Ecb(17, 115)),
      new EcBlocks(28, new Ecb(10, 46),
        new Ecb(23, 47)),
      new EcBlocks(30, new Ecb(10, 24),
        new Ecb(35, 25)),
      new EcBlocks(30, new Ecb(19, 15),
        new Ecb(35, 16))),
    new Version(33, Int32Array.from([6, 30, 58, 86, 114, 142]),
      new EcBlocks(30, new Ecb(17, 115),
        new Ecb(1, 116)),
      new EcBlocks(28, new Ecb(14, 46),
        new Ecb(21, 47)),
      new EcBlocks(30, new Ecb(29, 24),
        new Ecb(19, 25)),
      new EcBlocks(30, new Ecb(11, 15),
        new Ecb(46, 16))),
    new Version(34, Int32Array.from([6, 34, 62, 90, 118, 146]),
      new EcBlocks(30, new Ecb(13, 115),
        new Ecb(6, 116)),
      new EcBlocks(28, new Ecb(14, 46),
        new Ecb(23, 47)),
      new EcBlocks(30, new Ecb(44, 24),
        new Ecb(7, 25)),
      new EcBlocks(30, new Ecb(59, 16),
        new Ecb(1, 17))),
    new Version(35, Int32Array.from([6, 30, 54, 78, 102, 126, 150]),
      new EcBlocks(30, new Ecb(12, 121),
        new Ecb(7, 122)),
      new EcBlocks(28, new Ecb(12, 47),
        new Ecb(26, 48)),
      new EcBlocks(30, new Ecb(39, 24),
        new Ecb(14, 25)),
      new EcBlocks(30, new Ecb(22, 15),
        new Ecb(41, 16))),
    new Version(36, Int32Array.from([6, 24, 50, 76, 102, 128, 154]),
      new EcBlocks(30, new Ecb(6, 121),
        new Ecb(14, 122)),
      new EcBlocks(28, new Ecb(6, 47),
        new Ecb(34, 48)),
      new EcBlocks(30, new Ecb(46, 24),
        new Ecb(10, 25)),
      new EcBlocks(30, new Ecb(2, 15),
        new Ecb(64, 16))),
    new Version(37, Int32Array.from([6, 28, 54, 80, 106, 132, 158]),
      new EcBlocks(30, new Ecb(17, 122),
        new Ecb(4, 123)),
      new EcBlocks(28, new Ecb(29, 46),
        new Ecb(14, 47)),
      new EcBlocks(30, new Ecb(49, 24),
        new Ecb(10, 25)),
      new EcBlocks(30, new Ecb(24, 15),
        new Ecb(46, 16))),
    new Version(38, Int32Array.from([6, 32, 58, 84, 110, 136, 162]),
      new EcBlocks(30, new Ecb(4, 122),
        new Ecb(18, 123)),
      new EcBlocks(28, new Ecb(13, 46),
        new Ecb(32, 47)),
      new EcBlocks(30, new Ecb(48, 24),
        new Ecb(14, 25)),
      new EcBlocks(30, new Ecb(42, 15),
        new Ecb(32, 16))),
    new Version(39, Int32Array.from([6, 26, 54, 82, 110, 138, 166]),
      new EcBlocks(30, new Ecb(20, 117),
        new Ecb(4, 118)),
      new EcBlocks(28, new Ecb(40, 47),
        new Ecb(7, 48)),
      new EcBlocks(30, new Ecb(43, 24),
        new Ecb(22, 25)),
      new EcBlocks(30, new Ecb(10, 15),
        new Ecb(67, 16))),
    new Version(40, Int32Array.from([6, 30, 58, 86, 114, 142, 170]),
      new EcBlocks(30, new Ecb(19, 118),
        new Ecb(6, 119)),
      new EcBlocks(28, new Ecb(18, 47),
        new Ecb(31, 48)),
      new EcBlocks(30, new Ecb(34, 24),
        new Ecb(34, 25)),
      new EcBlocks(30, new Ecb(20, 15),
        new Ecb(61, 16)))
  ];

  private ecBlocks: EcBlocks[];
  private totalCodewords: number;

  private constructor(
    private versionNumber: number,
    private alignmentPatternCenters: Int32Array,
    ...ecBlocks: EcBlocks[]
  ) {
    this.ecBlocks = ecBlocks;
    let total = 0;
    const ecCodewords = ecBlocks[0].getEcCodewordsPerBlock();
    const ecbArray: Ecb[] = ecBlocks[0].getEcBlocks();

    for (const ecBlock of ecbArray)
      total += ecBlock.getCount() * (ecBlock.getDataCodewords() + ecCodewords);

    this.totalCodewords = total;
  }

  static getProvisionalVersionForDimension = (dimension: number) => {
    if (dimension % 4 !== 1)
      throw new FormatException();

    try {
      return Version.getVersionForNumber((dimension - 17) / 4);
    } catch {
      throw new FormatException();
    }
  }

  static getVersionForNumber = (versionNumber: number) => {
    if (versionNumber < 1 || versionNumber > 40)
      throw new IllegalArgumentException();

    return Version.VERSIONS[versionNumber - 1];
  }

  static decodeVersionInformation = (versionBits: number) => {
    let bestDifference = Number.MAX_SAFE_INTEGER;
    let bestVersion = 0;

    for (let i = 0; i < Version.VERSION_DECODE_INFO.length; i++) {
      const targetVersion = Version.VERSION_DECODE_INFO[i];

      if (targetVersion === versionBits)
        return Version.getVersionForNumber(i + 7);

      const bitsDifference = FormatInformation.numBitsDiffering(versionBits, targetVersion);

      if (bitsDifference < bestDifference) {
        bestVersion = i + 7;
        bestDifference = bitsDifference;
      }
    }

    if (bestDifference <= 3)
      return Version.getVersionForNumber(bestVersion);

    return null;
  }

  getVersionNumber = () => this.versionNumber;
  getAlignmentPatternCenters = () => this.alignmentPatternCenters;
  getTotalCodewords = () => this.totalCodewords;
  getDimensionForVersion = () => 17 + 4 * this.versionNumber;
  getEcBlocksForLevel = (ecLevel: ErrorCorrectionLevel) => this.ecBlocks[ecLevel.getValue()];

  buildFunctionPattern = () => {
    const dimension = this.getDimensionForVersion();
    const bitMatrix = new BitMatrix(dimension);

    bitMatrix.setRegion(0, 0, 9, 9);
    bitMatrix.setRegion(dimension - 8, 0, 8, 9);
    bitMatrix.setRegion(0, dimension - 8, 9, 8);

    const max = this.alignmentPatternCenters.length;

    for (let x = 0; x < max; x++) {
      const i = this.alignmentPatternCenters[x] - 2;

      for (let y = 0; y < max; y++) {
        if ((x === 0 && (y === 0 || y === max - 1)) || (x === max - 1 && y === 0))
          continue;

        bitMatrix.setRegion(this.alignmentPatternCenters[y] - 2, i, 5, 5);
      }
    }

    bitMatrix.setRegion(6, 9, 1, dimension - 17);
    bitMatrix.setRegion(9, 6, dimension - 17, 1);

    if (this.versionNumber > 6) {
      bitMatrix.setRegion(dimension - 11, 0, 3, 6);
      bitMatrix.setRegion(0, dimension - 11, 6, 3);
    }

    return bitMatrix;
  }

  toString = () => `${this.versionNumber}`;
}
