import { AbstractGenericGf } from './abstract-generic-gf';
import { GenericGfPoly } from './generic-gf-poly';
import { ArithmeticException } from '../../exception/arithmetic-exception';
import { IllegalArgumentException } from '../../exception/illegal-argument-exception';
import { Integer } from '../../util/integer';

export class GenericGf extends AbstractGenericGf {
  static QR_CODE_FIELD_256 = new GenericGf(0x011d, 256, 0);

  private zero: GenericGfPoly;
  private one: GenericGfPoly;

  constructor(
    private primitive: number,
    private size: number,
    private generatorBase: number
  ) {
    super();

    const expTable = new Int32Array(size);
    let x = 1;

    for (let i = 0; i < size; i++) {
      expTable[i] = x;
      x *= 2;

      if (x >= size) {
        x ^= primitive;
        x &= size - 1;
      }
    }

    this.expTable = expTable;

    const logTable = new Int32Array(size);

    for (let i = 0; i < size  - 1; i++)
      logTable[expTable[i]] = i;

    this.logTable = logTable;

    this.zero = new GenericGfPoly(this, Int32Array.from([0]));
    this.one = new GenericGfPoly(this, Int32Array.from([1]));
  }

  getZero = () => this.zero;
  getOne = () => this.one;

  buildMonomial = (degree: number, coefficient: number): GenericGfPoly => {
    if (degree < 0)
      throw new IllegalArgumentException();

    if (coefficient === 0)
      return this.zero;

    const coefficients = new Int32Array(degree + 1);
    coefficients[0] = coefficient;
    return new GenericGfPoly(this, coefficients);
  }

  inverse = (a: number) => {
    if (a === 0)
      throw new ArithmeticException();

    return this.expTable[this.size - this.logTable[a] - 1];
  }

  multiply = (a: number, b: number) => {
    if (a === 0 || b === 0)
      return 0;

    return this.expTable[
      (this.logTable[a] + this.logTable[b]) % (this.size - 1)
    ];
  }

  getSize = () => this.size;
  getGeneratorBase = () => this.generatorBase;

  toString = () => `GF(0x${Integer.toHexString(this.primitive)},${this.size})`;

  equals = (o: Object) => o === this;
}
