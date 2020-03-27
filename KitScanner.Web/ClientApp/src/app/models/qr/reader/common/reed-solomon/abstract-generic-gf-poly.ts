import { AbstractGenericGf } from './abstract-generic-gf';

export abstract class AbstractGenericGfPoly {
  protected field: AbstractGenericGf;
  protected coefficients: Int32Array;

  getCoefficients = () => this.coefficients;
  getDegree = () => this.coefficients.length - 1;
  isZero = () => this.coefficients[0] === 0;
  getCoefficient = (degree: number) => this.coefficients[this.coefficients.length - 1 - degree];

  evaluateAt = (a: number): number => {
    if (a === 0)
      return this.getCoefficient(0);

    let result: number;

    if (a === 1) {
      result = 0;

      for (let i = 0, length = this.coefficients.length; i !== length; i++) {
        const coefficient = this.coefficients[i];
        result = AbstractGenericGf.addOrSubtract(result, coefficient);
      }

      return result;
    }

    result = this.coefficients[0];

    for (let i = 1; i < this.coefficients.length; i++)
      result = AbstractGenericGf.addOrSubtract(this.field.multiply(a, result), this.coefficients[i]);

    return result;
  }

  abstract addOrSubtract(other: AbstractGenericGfPoly): AbstractGenericGfPoly;
  abstract multiply(other: AbstractGenericGfPoly): AbstractGenericGfPoly;
  abstract multilpyScalar(scalar: number): AbstractGenericGfPoly;
  abstract multiplyByMonomial(degree: number, coefficient: number): AbstractGenericGfPoly;
  abstract divide(other: AbstractGenericGfPoly): AbstractGenericGfPoly[];

  toString = () => {
    let result = '';

    for (let degree = this.getDegree(); degree >= 0; degree--) {
      let coefficient = this.getCoefficient(degree);

      if (coefficient !== 0) {
        if (coefficient < 0) {
          result += ' - ';
          coefficient = -coefficient;
        } else {
          if (result.length > 0)
            result += ' + ';
        }

        if (degree === 0 || coefficient !== 1) {
          const alphaPower = this.field.log(coefficient);

          if (alphaPower === 0)
            result += '1';
          else if (alphaPower === 1)
            result += 'a';
          else {
            result += 'a^';
            result += alphaPower;
          }
        }

        if (degree !== 0) {
          if (degree === 1)
            result += 'x';
          else {
            result += 'x^';
            result += degree;
          }
        }
      }
    }

    return result;
  }
}
