import { Version } from './version';
import { IllegalArgumentException } from '../../exception/illegal-argument-exception';

export enum ModeValues {
  TERMINATOR,
  NUMERIC,
  ALPHANUMERIC,
  STRUCTURED_APPEND,
  BYTE,
  ECI,
  KANJI,
  FNC1_FIRST_POSITION,
  FNC1_SECOND_POSITION,
  HANZI
}

export class ReadMode {
  private static FOR_BITS = new Map<number, ReadMode>();
  private static FOR_VALUE = new Map<ModeValues, ReadMode>();

  static TERMINATOR = new ReadMode(ModeValues.TERMINATOR, 'TERMINATOR', Int32Array.from([0, 0, 0]), 0x00);
  static NUMERIC = new ReadMode(ModeValues.NUMERIC, 'NUMERIC', Int32Array.from([10, 12, 14]), 0x01);
  static ALPHANUMERIC = new ReadMode(ModeValues.ALPHANUMERIC, 'ALPHANUMERIC', Int32Array.from([9, 11, 13]), 0x02);
  static STRUCTURED_APPEND = new ReadMode(ModeValues.STRUCTURED_APPEND, 'STRUCTURED_APPEND', Int32Array.from([0, 0, 0]), 0x03);
  static BYTE = new ReadMode(ModeValues.BYTE, 'BYTE', Int32Array.from([8, 16, 16]), 0x04);
  static ECI = new ReadMode(ModeValues.ECI, 'ECI', Int32Array.from([0, 0, 0]), 0x07);
  static KANJI = new ReadMode(ModeValues.KANJI, 'KANJI', Int32Array.from([8, 10, 12]), 0x08);
  static FNC1_FIRST_POSITION = new ReadMode(ModeValues.FNC1_FIRST_POSITION, 'FNC1_FIRST_POSITION', Int32Array.from([0, 0, 0]), 0x05);
  static FNC1_SECOND_POSITION = new ReadMode(ModeValues.FNC1_SECOND_POSITION, 'FNC1_SECOND_POSITION', Int32Array.from([0, 0, 0]), 0x09);
  static HANZI = new ReadMode(ModeValues.HANZI, 'HANZI', Int32Array.from([8, 10, 12]), 0x0D);

  private constructor(
    private value: ModeValues,
    private stringValue: string,
    private characterCountBitsForVersions: Int32Array,
    private bits: number
  ) {
    ReadMode.FOR_BITS.set(bits, this);
    ReadMode.FOR_VALUE.set(value, this);
  }

  static forBits = (bits: number) => {
    const mode = ReadMode.FOR_BITS.get(bits);

    if (undefined === mode)
      throw new IllegalArgumentException();

    return mode;
  }

  getCharacterCountBits = (version: Version) => {
    const versionNumber = version.getVersionNumber();

    let offset;

    if (versionNumber <= 9)
      offset = 0;
    else if (versionNumber <= 26)
      offset = 1;
    else
      offset = 2;

    return this.characterCountBitsForVersions[offset];
  }

  getValue = () => this.value;
  getBits = () => this.bits;

  equals = (o: any) => {
    if (!(o instanceof ReadMode))
      return false;

    const other = <ReadMode>o;
    return this.value === other.value;
  }

  toString = () => this.stringValue;
}
