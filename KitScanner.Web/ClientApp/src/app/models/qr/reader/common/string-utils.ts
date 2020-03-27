import { CharacterSetEci } from './character-set-eci';
import { DecodeHintType } from '../decode-hint-type';
import { StringEncoding } from '../util/string-encoding';

export class StringUtils {
  private static EUC_JP = 'EUC_JP';
  private static UTF8 = CharacterSetEci.UTF8.getName();
  private static PLATFORM_DEFAULT_ENCODING = StringUtils.UTF8;
  private static ASSUM_SHIFT_JIS = false;

  static SHIFT_JIS = CharacterSetEci.SJIS.getName();
  static GB2312 = 'GB2312';
  static ISO88591 = CharacterSetEci.ISO8859_1.getName();

  static guessEncoding = (bytes: Uint8Array, hints: Map<DecodeHintType, any>): string => {
    if (hints !== null && hints !== undefined && undefined !== hints.get(DecodeHintType.CHARACTER_SET))
      return hints.get(DecodeHintType.CHARACTER_SET).toString();

    const length = bytes.length;

    let canBeISO88591 = true;
    let isoHighOther = 0;

    let canBeUTF8 = true;
    let utf8BytesLeft = 0;
    let utf2BytesChars = 0;
    let utf3BytesChars = 0;
    let utf4BytesChars = 0;

    let canBeShiftJIS = true;
    let sjisBytesLeft = 0;
    let sjisKatakanaChars = 0;
    let sjisCurKatakanaWordLength = 0;
    let sjisCurDoubleBytesWordLength = 0;
    let sjisMaxKatakanaWordLength = 0;
    let sjisMaxDoubleBytesWordLength = 0;

    const utf8bom = bytes.length > 3 &&
      bytes[0] === 0xef &&
      bytes[1] === 0xbb &&
      bytes[2] === 0xbf;

    for (let i = 0; i < length && (canBeISO88591 || canBeShiftJIS || canBeUTF8); i++) {
      const value = bytes[i] & 0xff;

      if (canBeUTF8)
        if (utf8BytesLeft > 0) {
          if ((value & 0x80) === 0)
            canBeUTF8 = false;
          else
            utf8BytesLeft--;
        } else if ((value & 0x80) !== 0) {
          if ((value & 0x40) === 0)
            canBeUTF8 = false
          else {
            utf8BytesLeft++;

            if ((value & 0x20) === 0)
              utf2BytesChars++;
            else {
              utf8BytesLeft++;

              if ((value & 0x10) === 0)
                utf3BytesChars++;
              else {
                utf8BytesLeft++;

                if ((value & 0x08) == 0)
                  utf4BytesChars++;
                else
                  canBeUTF8 = false;
              }
            }
          }
        }

      if (canBeISO88591)
        if (value > 0x7f && value < 0xa0)
          canBeISO88591 = false;
        else if (value > 0x9f)
          if (value < 0xc0 || value === 0xd7 || value === 0xf7)
            isoHighOther++;

      if (canBeShiftJIS)
        if (sjisBytesLeft > 0)
          if (value < 0x40 || value == 0x7f || value > 0xfc)
            canBeShiftJIS = false;
          else
            sjisBytesLeft--;
        else if (value === 0x80 || value === 0xa0 || value > 0xef)
          canBeShiftJIS = false;
        else if (value > 0xa0 && value < 0xe0) {
          sjisKatakanaChars++;
          sjisCurDoubleBytesWordLength = 0;
          sjisCurKatakanaWordLength++;

          if (sjisCurKatakanaWordLength > sjisMaxKatakanaWordLength)
            sjisMaxKatakanaWordLength = sjisCurKatakanaWordLength;
        } else if (value > 0x7f) {
          sjisBytesLeft++;
          sjisCurKatakanaWordLength = 0;
          sjisCurDoubleBytesWordLength++;

          if (sjisCurDoubleBytesWordLength > sjisMaxDoubleBytesWordLength)
            sjisMaxDoubleBytesWordLength = sjisCurDoubleBytesWordLength;
        } else {
          sjisCurKatakanaWordLength = 0;
          sjisCurDoubleBytesWordLength = 0;
        }
    }

    if (canBeUTF8 && utf8BytesLeft > 0)
      canBeUTF8 = false;

    if (canBeShiftJIS && sjisBytesLeft > 0)
      canBeShiftJIS = false;

    if (canBeUTF8 && (utf8bom || utf2BytesChars + utf3BytesChars + utf4BytesChars > 0))
      return StringUtils.UTF8;

    if (canBeShiftJIS && (StringUtils.ASSUM_SHIFT_JIS || sjisMaxKatakanaWordLength >= 3 || sjisMaxDoubleBytesWordLength >= 3))
      return StringUtils.SHIFT_JIS;

    if (canBeISO88591 && canBeShiftJIS)
      return (sjisMaxKatakanaWordLength === 2 && sjisKatakanaChars === 2) || isoHighOther * 10 >= length
        ? StringUtils.SHIFT_JIS
        : StringUtils.ISO88591;

    if (canBeISO88591)
      return StringUtils.ISO88591;

    if (canBeShiftJIS)
      return StringUtils.SHIFT_JIS;

    if (canBeUTF8)
      return StringUtils.UTF8;

    return StringUtils.PLATFORM_DEFAULT_ENCODING;
  }

  static format = (append: string, ...args: any[]) => {
    let i = -1;

    const callback = (exp: string | number, p0: any, p1: any, p2: any, p3: any, p4: any) => {
      if (exp === '%%') return '%';
      if (args[++i] === undefined) return undefined;

      exp = p2 ? parseInt(p2.substr(1)) : undefined;

      let base = p3 ? parseInt(p3.substr(1)) : undefined;
      let val: string;

      switch (p4) {
        case 's': val = args[i]; break;
        case 'c': val = args[i][0]; break;
        case 'f': val = parseFloat(args[i]).toFixed(exp); break;
        case 'p': val = parseFloat(args[i]).toPrecision(exp); break;
        case 'e': val = parseFloat(args[i]).toExponential(exp); break;
        case 'x': val = parseInt(args[i]).toString(base ? base : 16); break;
        case 'd': val = parseFloat(parseInt(args[i], base ? base : 10).toPrecision(exp)).toFixed(0); break;
      }

      val = typeof val === 'object' ? JSON.stringify(val) : (+val).toString(base);
      let size = parseInt(p1);
      let ch = p1 && (p1[0] + '') === '0' ? '0' : ' ';

      while (val.length < size) val = p0 !== undefined ? val + ch : ch + val;

      return val;
    }

    let regex = /%(-)?(0?[0-9]+)?([.][0-9]+)?([#][0-9]+)?([scfpexd%])/g;

    return append.replace(regex, callback);
  }

  static getBytes = (str: string, encoding: CharacterSetEci) => StringEncoding.encode(str, encoding);

  static getCharCode = (str: string, index = 0) => str.charCodeAt(index);
}
