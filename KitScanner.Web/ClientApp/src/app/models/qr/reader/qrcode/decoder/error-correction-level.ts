import { ArgumentException } from '../../exception/argument-exception';
import { IllegalArgumentException } from '../../exception/illegal-argument-exception';

export enum ErrorCorrectionLevelValues {
  L,
  M,
  Q,
  H
}

export class ErrorCorrectionLevel {
  private static FOR_BITS = new Map<number, ErrorCorrectionLevel>();
  private static FOR_VALUE = new Map<ErrorCorrectionLevelValues, ErrorCorrectionLevel>();

  static L = new ErrorCorrectionLevel(ErrorCorrectionLevelValues.L, 'L', 0x01);
  static M = new ErrorCorrectionLevel(ErrorCorrectionLevelValues.M, 'M', 0x00);
  static Q = new ErrorCorrectionLevel(ErrorCorrectionLevelValues.Q, 'Q', 0x03);
  static H = new ErrorCorrectionLevel(ErrorCorrectionLevelValues.H, 'H', 0x02);

  private constructor(
    private value: ErrorCorrectionLevelValues,
    private stringValue: string,
    private bits: number
  ) {
    ErrorCorrectionLevel.FOR_BITS.set(bits, this);
    ErrorCorrectionLevel.FOR_VALUE.set(value, this);
  }

  static fromString = (s: string) => {
    switch (s.toUpperCase()) {
      case 'L': return ErrorCorrectionLevel.L;
      case 'M': return ErrorCorrectionLevel.M;
      case 'Q': return ErrorCorrectionLevel.Q;
      case 'H': return ErrorCorrectionLevel.H;
      default: throw new ArgumentException(`${s} not available`);
    }
  }

  static forBits = (bits: number) => {
    if (bits < 0 || bits >= ErrorCorrectionLevel.FOR_BITS.size)
      throw new IllegalArgumentException();

    return ErrorCorrectionLevel.FOR_BITS.get(bits);
  }

  getValue = () => this.value;
  getBits = () => this.bits;
  toString = () => this.stringValue;

  equals = (o: any) => {
    if (!(o instanceof ErrorCorrectionLevel))
      return false;

    const other = <ErrorCorrectionLevel>o;
    return this.value === other.value;
  }
}
