/*
  Describes how a segment's data bits are interpreted. Immutable.
*/
export class Mode {
  public static readonly NUMERIC      = new Mode(0x1, [10, 12, 14]);
  public static readonly ALPHANUMERIC = new Mode(0x2, [9, 11, 13]);
  public static readonly BYTE         = new Mode(0x4, [8, 16, 16]);
  public static readonly ECI          = new Mode(0x7, [0, 0, 0]);

  private constructor(
    public readonly modeBits: number,
    private readonly numBitsCharCount: [number, number, number]
  ) { }

  public numCharCountBits = (ver: number): number => this.numBitsCharCount[Math.floor((ver + 7) / 17)];
}
