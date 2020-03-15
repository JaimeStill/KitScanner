type bit = number;
type byte = number;
type int = number;

import { Mode } from './mode';

/*
  A segment of character / binary / control data in a QR code symbol.
  Instances of this class are immutable.
  The mid-level way to create a segment is to take the payload data
  and call a static factory function such as QrSegment.makeNumeric().
  The low-level way to create a segment is to custom-make the bit buffer
  and call the QrSegment() constructor with appropriate values.
  This segment class imposes no length restrictions, but QR Codes have restrictions.
  Even in the most favorable conditions, a QR Code can only hold 7089 characters of data.
  Any segment longer than this is meaningless for the purpose of generating QR Codes.
*/
export class QrSegment {
  // Describes precisely all strings that are encodable in numeric mode. To test
  // whether a string s is encodable: let ok: boolean = NUMERIC_REGEX.test(s);
  // A string is encodable iff each character is in the range 0 to 9.
  public static readonly NUMERIC_REGEX: RegExp = /^[0-9]*$/;

  // Describes precisely all strings that are encodable in alphanumeric mode. To test
  // whether a string s is encodable: let ok: boolean = ALPHANUMERIC_REGEX.test(s);
  // A string is encodable iff each character is in the following set: 0 to 9, A to Z
  // (uppercase only), space, dollar, percent, asterisk, plus, hyphen, period, slash, colon.
  public static readonly ALPHANUMERIC_REGEX: RegExp = /^[A-Z0-9 $%*+.\/:-]*$/;

  // The set of all legal characters in alphanumeric mode,
  // where each character value maps to the index in the string.
  private static readonly ALPHANUMERIC_CHARSET: string = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";

  // Creates a new QR Code segment with the given attributes and data.
  // The character count (numChars) must agree with the mode and the bit buffer length,
  // but the constraint isn't checked. The given bit buffer is cloned and stored.
  public constructor(
    // The mode indicator of this segment.
    public readonly mode: Mode,

    // The length of this segment's unencoded data. Measured in characters for
    // numeric/alphanumeric/kanji mode, bytes for byte mode, and 0 for ECI mode.
    // Always zero or positive. Not the same as the data's bit length.
    public readonly numChars: int,

    // The data bits of this segment. Accessed through getData().
    private readonly bitData: Array<bit>
  ) {
    if (numChars < 0)
      throw "Invalid argument";
    this.bitData = bitData.slice();  // Make defensive copy
  }

  // Returns a new array of bytes representing the given string encoded in UTF-8.
  private static toUtf8ByteArray(str: string): Array<byte> {
    str = encodeURI(str);
    let result: Array<byte> = [];
    for (let i = 0; i < str.length; i++) {
      if (str.charAt(i) != "%")
        result.push(str.charCodeAt(i));
      else {
        result.push(parseInt(str.substr(i + 1, 2), 16));
        i += 2;
      }
    }
    return result;
  }

  // Appends the given number of low-order bits of the given value
// to the given buffer. Requires 0 <= len <= 31 and 0 <= val < 2^len.
  public static appendBits(val: int, len: int, bb: Array<bit>): void {
    if (len < 0 || len > 31 || val >>> len != 0)
    throw "Value out of range";
  for (let i = len - 1; i >= 0; i--)  // Append bit by bit
    bb.push((val >>> i) & 1);
  }

  // Returns true if the i'th bit of x is set to 1.
  public static getBit = (x: int, i: int): boolean => ((x >>> i) & 1) != 0;

  /// Returns a segment representing the given binary data encoded in
  // byte mode. All input byte arrays are acceptable. Any text string
  // can be converted to UTF-8 bytes and encoded as a byte mode segment.
  public static makeBytes(data: Array<byte>): QrSegment {
    let bb: Array<bit> = []
    for (const b of data)
      QrSegment.appendBits(b, 8, bb);
    return new QrSegment(Mode.BYTE, data.length, bb);
  }

  // Returns a segment representing the given string of decimal digits encoded in numeric mode.
  public static makeNumeric(digits: string): QrSegment {
    if (!this.NUMERIC_REGEX.test(digits))
      throw "String contains non-numeric characters";
    let bb: Array<bit> = []
    for (let i = 0; i < digits.length;) {  // Consume up to 3 digits per iteration
      const n: int = Math.min(digits.length - i, 3);
      QrSegment.appendBits(parseInt(digits.substr(i, n), 10), n * 3 + 1, bb);
      i += n;
    }
    return new QrSegment(Mode.NUMERIC, digits.length, bb);
  }

  // Returns a segment representing the given text string encoded in alphanumeric mode.
  // The characters allowed are: 0 to 9, A to Z (uppercase only), space,
  // dollar, percent, asterisk, plus, hyphen, period, slash, colon.
  public static makeAlphanumeric(text: string): QrSegment {
    if (!this.ALPHANUMERIC_REGEX.test(text))
      throw "String contains unencodable characters in alphanumeric mode";
    let bb: Array<bit> = []
    let i: int;
    for (i = 0; i + 2 <= text.length; i += 2) {  // Process groups of 2
      let temp: int = QrSegment.ALPHANUMERIC_CHARSET.indexOf(text.charAt(i)) * 45;
      temp += QrSegment.ALPHANUMERIC_CHARSET.indexOf(text.charAt(i + 1));
      QrSegment.appendBits(temp, 11, bb);
    }
    if (i < text.length)  // 1 character remaining
      QrSegment.appendBits(QrSegment.ALPHANUMERIC_CHARSET.indexOf(text.charAt(i)), 6, bb);
    return new QrSegment(Mode.ALPHANUMERIC, text.length, bb);
  }

  // Returns a new mutable list of zero or more segments to represent the given Unicode text string.
  // The result may use various segment modes and switch modes to optimize the length of the bit stream.
  public static makeSegments(text: string): Array<QrSegment> {
    // Select the most efficient segment encoding automatically
    if (text == "")
      return [];
    else if (this.NUMERIC_REGEX.test(text))
      return [QrSegment.makeNumeric(text)];
    else if (this.ALPHANUMERIC_REGEX.test(text))
      return [QrSegment.makeAlphanumeric(text)];
    else
      return [QrSegment.makeBytes(QrSegment.toUtf8ByteArray(text))];
  }

  // Returns a segment representing an Extended Channel Interpretation
  // (ECI) designator with the given assignment value.
  public static makeEci(assignVal: int): QrSegment {
    let bb: Array<bit> = []
    if (assignVal < 0)
      throw "ECI assignment value out of range";
    else if (assignVal < (1 << 7))
      QrSegment.appendBits(assignVal, 8, bb);
    else if (assignVal < (1 << 14)) {
      QrSegment.appendBits(2, 2, bb);
      QrSegment.appendBits(assignVal, 14, bb);
    } else if (assignVal < 1000000) {
      QrSegment.appendBits(6, 3, bb);
      QrSegment.appendBits(assignVal, 21, bb);
    } else
      throw "ECI assignment value out of range";
    return new QrSegment(Mode.ECI, 0, bb);
  }

  // (Package-private) Calculates and returns the number of bits needed to encode the given segments at
  // the given version. The result is infinity if a segment has too many characters to fit its length field.
  public static getTotalBits(segs: Array<QrSegment>, version: int): number {
    let result: number = 0;
    for (const seg of segs) {
      const ccbits: int = seg.mode.numCharCountBits(version);
      if (seg.numChars >= (1 << ccbits))
        return Infinity;  // The segment's length doesn't fit the field's bit width
      result += 4 + ccbits + seg.bitData.length;
    }
    return result;
  }

  // Returns a new copy of the data bits of this segment
  public getData = (): Array<bit> => this.bitData.slice(); // Make defensive copy
}
