/*
  Error correction level in a QR Code symbol. Immutable.
*/
export class Ecc {
  public static readonly LOW      = new Ecc(0, 1); // tolerates about 7% erroneous codewords
  public static readonly MEDIUM   = new Ecc(1, 0); // tolerates about 15% erroneous codewords
  public static readonly QUANTILE = new Ecc(2, 3); // tolerates about 25% erroneous codewords
  public static readonly HIGH     = new Ecc(3, 2); // tolerates about 30% erroneous codewords

  private constructor(
    public readonly ordinal: number,
    public readonly formatBits: number
  ) { }
}
