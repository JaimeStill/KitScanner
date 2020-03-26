import { ErrorCorrectionLevel } from './error-correction-level';
import { ReadMode } from './read-mode';
import { Version } from './version';
import { DecodeHintType } from '../../decode-hint-type';
import { BitSource } from '../../common/bit-source';
import { CharacterSetEci } from '../../common/character-set-eci';
import { DecoderResult } from '../../common/decoder-result';
import { StringUtils } from '../../common/string-utils';
import { FormatException } from '../../exception/format-exception';
import { StringBuilder } from '../../util/string-builder';
import { StringEncoding } from '../../util/string-encoding';

export class DecodedBitStreamParser {
  private static ALPHANUMERIC_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';
  private static GB2312_SUBSET = 1;

  private static decodeHanziSegment = (
    bits: BitSource,
    result: StringBuilder,
    count: number
  ) => {
    if (count * 13 > bits.available())
      throw new FormatException();

    const buffer = new Uint8Array(2 * count);
    let offset = 0;
    while (count > 0) {
      const twoBytes = bits.readBits(13);
      let assembledTwoBytes = (((twoBytes / 0x060) << 8) & 0xFFFFFFFF) | (twoBytes % 0x060);

      if (assembledTwoBytes < 0x003BF)
        assembledTwoBytes += 0x0A1A1;
      else
        assembledTwoBytes += 0x0A6A1;

      buffer[offset] = ((assembledTwoBytes >> 8) & 0xFF);
      buffer[offset + 1] = (assembledTwoBytes & 0xFF);
      offset += 2;
      count--;
    }

    try {
      result.append(StringEncoding.decode(buffer, StringUtils.GB2312));
    } catch (ignored) {
      throw new FormatException(ignored);
    }
  }

  private static decodeKanjiSegment = (
    bits: BitSource,
    result: StringBuilder,
    count: number
  ) => {
    if (count * 13 > bits.available())
      throw new FormatException();

    const buffer = new Uint8Array(2 * count);
    let offset = 0;
    while (count > 0) {
      const twoBytes = bits.readBits(13);
      let assembledTwoBytes = (((twoBytes / 0x0C0) << 8) & 0xFFFFFFFF) | (twoBytes % 0x0C0);
      if (assembledTwoBytes < 0x01F00)
        assembledTwoBytes += 0x08140;
      else
        assembledTwoBytes += 0x0C140;

      buffer[offset] = (assembledTwoBytes >> 8);
      buffer[offset + 1] = assembledTwoBytes;
      offset += 2;
      count--;
    }

    try {
      result.append(StringEncoding.decode(buffer, StringUtils.SHIFT_JIS));
    } catch (ignored) {
      throw new FormatException(ignored);
    }
  }

  private static decodeByteSegment = (
    bits: BitSource,
    result: StringBuilder,
    count: number,
    currentCharacterSetEci: CharacterSetEci,
    byteSegments: Uint8Array[],
    hints: Map<DecodeHintType, any>
  ) => {
    if (8 * count > bits.available())
      throw new FormatException();

    const readBytes = new Uint8Array(count);

    for (let i = 0; i < count; i++)
      readBytes[i] = bits.readBits(8);

    let encoding: string;

    if (currentCharacterSetEci === null)
      encoding = StringUtils.guessEncoding(readBytes, hints);
    else
      encoding = currentCharacterSetEci.getName();

    try {
      result.append(StringEncoding.decode(readBytes, encoding));
    } catch (ignored) {
      throw new FormatException(ignored);
    }

    byteSegments.push(readBytes);
  }

  private static toAlphaNumericChar = (value: number) => {
    if (value >= DecodedBitStreamParser.ALPHANUMERIC_CHARS.length)
      throw new FormatException();

    return DecodedBitStreamParser.ALPHANUMERIC_CHARS[value];
  }

  private static decodeAlphanumericSegment = (
    bits: BitSource,
    result: StringBuilder,
    count: number,
    fc1InEffect: boolean
  ) => {
    const start = result.length();

    while (count > 1) {
      if (bits.available() < 11)
        throw new FormatException();

      const nextTwoCharsBits = bits.readBits(11);
      result.append(DecodedBitStreamParser.toAlphaNumericChar(Math.floor(nextTwoCharsBits / 45)));
      result.append(DecodedBitStreamParser.toAlphaNumericChar(nextTwoCharsBits % 45));
      count -= 2;
    }

    if (count === 1) {
      if (bits.available() < 6)
        throw new FormatException();

      result.append(DecodedBitStreamParser.toAlphaNumericChar(bits.readBits(6)));
    }

    if (fc1InEffect)
      for (let i = start; i < result.length(); i++)
        if (result.charAt(i) === '%')
          if (i < result.length() - 1 && result.charAt(i + 1) === '%')
            result.deleteCharAt(i + 1);
          else
            result.setCharAt(i, String.fromCharCode(0x1D));
  }

  private static decodeNumericSegment = (
    bits: BitSource,
    result: StringBuilder,
    count: number
  ) => {
    while (count >= 3) {
      if (bits.available() < 10)
        throw new FormatException();

      const threeDigitsBits = bits.readBits(10);

      if (threeDigitsBits >= 1000)
        throw new FormatException();

      result.append(DecodedBitStreamParser.toAlphaNumericChar(Math.floor(threeDigitsBits / 100)));
      result.append(DecodedBitStreamParser.toAlphaNumericChar(Math.floor(threeDigitsBits / 10) % 10));
      result.append(DecodedBitStreamParser.toAlphaNumericChar(threeDigitsBits % 10));
      count -= 3;
    }

    if (count === 2) {
      if (bits.available() < 7)
        throw new FormatException();

      const twoDigitsBits = bits.readBits(7);

      if (twoDigitsBits >= 100)
        throw new FormatException();

      result.append(DecodedBitStreamParser.toAlphaNumericChar(Math.floor(twoDigitsBits / 10)));
      result.append(DecodedBitStreamParser.toAlphaNumericChar(twoDigitsBits % 10));
    } else if (count === 1) {
      if (bits.available() < 4)
        throw new FormatException();

      const digitBits = bits.readBits(4);

      if (digitBits >= 10)
        throw new FormatException();

      result.append(DecodedBitStreamParser.toAlphaNumericChar(digitBits));
    }
  }

  private static parseECIValue = (bits: BitSource) => {
    const firstByte = bits.readBits(8);

    if ((firstByte & 0x80) === 0)
      return firstByte & 0x7F;

    if ((firstByte & 0xC0) === 0x80) {
      const secondByte = bits.readBits(8);
      return (((firstByte & 0x3F) << 8) & 0xFFFFFFFF) | secondByte;
    }

    if ((firstByte & 0xE0) === 0xC0) {
      const secondThirdBytes = bits.readBits(16);
      return (((firstByte & 0x1F) << 16) & 0xFFFFFFFF) | secondThirdBytes;
    }

    throw new FormatException();
  }

  static decode = (
    bytes: Uint8Array,
    version: Version,
    ecLevel: ErrorCorrectionLevel,
    hints: Map<DecodeHintType, any>
  ) => {
    const bits = new BitSource(bytes);
    let result = new StringBuilder();
    const byteSegments = new Array<Uint8Array>();
    let symbolSequence = -1;
    let parityData = -1;

    try {
      let currentCharacterSetEci: CharacterSetEci = null;
      let fc1InEffect = false;
      let mode: ReadMode;
      do {
        if (bits.available() < 4)
          mode = ReadMode.TERMINATOR;
        else {
          const modeBits = bits.readBits(4);
          mode = ReadMode.forBits(modeBits); // mode is encoded by 4 bits
        }

        switch (mode) {
          case ReadMode.TERMINATOR:
            break;
          case ReadMode.FNC1_FIRST_POSITION:
          case ReadMode.FNC1_SECOND_POSITION:
            fc1InEffect = true;
            break;
          case ReadMode.STRUCTURED_APPEND:
            if (bits.available() < 16)
              throw new FormatException();

            symbolSequence = bits.readBits(8);
            parityData = bits.readBits(8);

            break;
          case ReadMode.ECI:
            const value = DecodedBitStreamParser.parseECIValue(bits);
            currentCharacterSetEci = CharacterSetEci.getCharacterSetEciByValue(value);

            if (currentCharacterSetEci === null)
              throw new FormatException();

            break;
          case ReadMode.HANZI:
            const subset = bits.readBits(4);
            const countHanzi = bits.readBits(mode.getCharacterCountBits(version));

            if (subset === DecodedBitStreamParser.GB2312_SUBSET)
              DecodedBitStreamParser.decodeHanziSegment(bits, result, countHanzi);

            break;
          default:
            const count = bits.readBits(mode.getCharacterCountBits(version));

            switch (mode) {
              case ReadMode.NUMERIC:
                DecodedBitStreamParser.decodeNumericSegment(bits, result, count);
                break;
              case ReadMode.ALPHANUMERIC:
                DecodedBitStreamParser.decodeAlphanumericSegment(bits, result, count, fc1InEffect);
                break;
              case ReadMode.BYTE:
                DecodedBitStreamParser.decodeByteSegment(bits, result, count, currentCharacterSetEci, byteSegments, hints);
                break;
              case ReadMode.KANJI:
                DecodedBitStreamParser.decodeKanjiSegment(bits, result, count);
                break;
              default:
                throw new FormatException();
            }
            break;
        }
      } while (mode !== ReadMode.TERMINATOR);
    } catch {
      throw new FormatException();
    }

    return new DecoderResult(
      bytes,
      result.toString(),
      byteSegments.length === 0 ? null : byteSegments,
      ecLevel === null ? null : ecLevel.toString(),
      symbolSequence,
      parityData
    );
  }
}

function Uint8ArrayToString(a: Uint8Array): string {
  const CHUNK_SZ = 0x8000;
  const c = new StringBuilder();

  for (let i = 0, length = a.length; i < length; i += CHUNK_SZ)
    c.append(String.fromCharCode.apply(null, a.subarray(i, i + CHUNK_SZ)));

  return c.toString();
}
