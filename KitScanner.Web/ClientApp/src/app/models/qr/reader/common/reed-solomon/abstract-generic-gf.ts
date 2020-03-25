import { IllegalArgumentException } from '../../exception/illegal-argument-exception';

export abstract class AbstractGenericGf {
  protected expTable: Int32Array;
  protected logTable: Int32Array;

  static addOrSubtract = (a: number, b: number) => a ^ b;

  abstract getZero(): any;

  abstract buildMonomial(
    degree: number,
    coefficient: number
  ): any;

  abstract equals(o: Object): boolean;
  abstract multiply(a: number, b: number): number;
  abstract inverse(a: number): number;

  exp = (a: number): number => this.expTable[a];
  log = (a: number): number => {
    if (a === 0)
      throw new IllegalArgumentException();

    return this.logTable[a];
  }
}
