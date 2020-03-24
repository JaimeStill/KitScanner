/*
  Error correction level in a QR Code symbol. Immutable.
*/
export class GenEcc {
  public static readonly LOW = new GenEcc(0, 1);  // The QR Code can tolerate about  7% erroneous codewords
  public static readonly MEDIUM = new GenEcc(1, 0);  // The QR Code can tolerate about 15% erroneous codewords
  public static readonly QUARTILE = new GenEcc(2, 3);  // The QR Code can tolerate about 25% erroneous codewords
  public static readonly HIGH = new GenEcc(3, 2);  // The QR Code can tolerate about 30% erroneous codewords

  private constructor(
    // In the range 0 to 3 (unsigned 2-bit integer).
    public readonly ordinal: int,
    // (Package-private) In the range 0 to 3 (unsigned 2-bit integer).
    public readonly formatBits: int
  ) { }
}
