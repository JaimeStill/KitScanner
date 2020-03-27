import { AbstractGenericGf } from './abstract-generic-gf';
import { IllegalArgumentException } from '../../exception/illegal-argument-exception';
import { System } from '../../util/system';

export class GenericGfPoly {
  private field: AbstractGenericGf;
  private coefficients: Int32Array;

  constructor(
    field: AbstractGenericGf,
    coefficients: Int32Array
  ) {
    if (coefficients.length === 0)
      throw new IllegalArgumentException();

    this.field = field;

    if (coefficients.length > 1 && coefficients[0] === 0) {
      let firstNonZero = 1;

      while (firstNonZero < coefficients.length && coefficients[firstNonZero] === 0)
        firstNonZero++;

      if (firstNonZero === coefficients.length)
        this.coefficients = Int32Array.from([0]);
      else {
        this.coefficients = new Int32Array(coefficients.length - firstNonZero);

        System.arraycopy(
          coefficients,
          firstNonZero,
          this.coefficients,
          0,
          this.coefficients.length
        );
      }
    } else {
      this.coefficients = coefficients;
    }
  }

  getCoefficients = () => this.coefficients;
  getDegree = () => this.coefficients.length - 1;
  isZero = () => this.coefficients[0] === 0;
  getCoefficient = (degree: number) => this.coefficients[this.coefficients.length - 1 - degree];

  evaluateAt = (a: number) => {
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

  addOrSubtract = (other: GenericGfPoly) => {
    if (!this.field.equals(other.field))
      throw new IllegalArgumentException('GenericGfPolys do not have same GenericGf field');

    if (this.isZero()) return other;

    if (other.isZero()) return this;

    let smallerCoefficients = this.coefficients;
    let largerCoefficients = other.coefficients;

    if (smallerCoefficients.length > largerCoefficients.length) {
      const temp = smallerCoefficients;
      smallerCoefficients = largerCoefficients;
      largerCoefficients = temp;
    }

    let sumDiff = new Int32Array(largerCoefficients.length);
    const lengthDiff = largerCoefficients.length - smallerCoefficients.length;

    System.arraycopy(largerCoefficients, 0, sumDiff, 0, lengthDiff);

    for (let i = lengthDiff; i < largerCoefficients.length; i++)
      sumDiff[i] = AbstractGenericGf.addOrSubtract(smallerCoefficients[i - lengthDiff], largerCoefficients[i]);

    return new GenericGfPoly(this.field, sumDiff);
  }

  multiply = (other: GenericGfPoly): GenericGfPoly => {
    if (!this.field.equals(other.field))
      throw new IllegalArgumentException('GenericGfPolys do not have same GenericGf field');

    if (this.isZero() || other.isZero()) return this.field.getZero();

    const product = new Int32Array(this.coefficients.length + other.coefficients.length - 1);

    for (let i = 0; i < this.coefficients.length; i++) {
      const aCoeff = this.coefficients[i];
      for (let j = 0; j < other.coefficients.length; j++)
        product[i + j] = AbstractGenericGf.addOrSubtract(product[i + j], this.field.multiply(aCoeff, other.coefficients[j]));
    }

    return new GenericGfPoly(this.field, product);
  }

  multiplyScalar = (scalar: number): GenericGfPoly => {
    if (scalar === 0)
      return this.field.getZero();

    if (scalar === 1)
      return this;

    const product = new Int32Array(this.coefficients.length);

    for (let i = 0; i < this.coefficients.length; i++)
      product[i] = this.field.multiply(this.coefficients[i], scalar);

    return new GenericGfPoly(this.field, product);
  }

  multiplyByMonomial = (degree: number, coefficient: number): GenericGfPoly => {
    if (degree < 0)
      throw new IllegalArgumentException();

    if (coefficient === 0)
      return this.field.getZero();

    const product = new Int32Array(this.coefficients.length + degree);

    for (let i = 0; i < this.coefficients.length; i++)
      product[i] = this.field.multiply(this.coefficients[i], coefficient);

    return new GenericGfPoly(this.field, product);
  }

  divide = (other: GenericGfPoly): GenericGfPoly[] => {
    if (!this.field.equals(other.field))
      throw new IllegalArgumentException('GenericGfPolys do not have the same GenericGf field');

    if (other.isZero())
      throw new IllegalArgumentException('Divide by 0');

    let quotient: GenericGfPoly = this.field.getZero();
    let remainder: GenericGfPoly = this;

    const denominatorLeadingTerm = other.getCoefficient(other.getDegree());
    const inverseDenominatorLeadingTerm = this.field.inverse(denominatorLeadingTerm);

    while (remainder.getDegree() >= other.getDegree() && !remainder.isZero()) {
      const degreeDifference = remainder.getDegree() - other.getDegree();
      const scale = this.field.multiply(remainder.getCoefficient(remainder.getDegree()), inverseDenominatorLeadingTerm);
      const term = other.multiplyByMonomial(degreeDifference, scale);
      const iterationQuotient = this.field.buildMonomial(degreeDifference, scale);
      quotient = quotient.addOrSubtract(iterationQuotient);
      remainder = remainder.addOrSubtract(term);
    }

    return [quotient, remainder];
  }

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
            result += ' + '
        }
        if (degree === 0 || coefficient !== 1) {
          const alphaPower = this.field.log(coefficient);

          if (alphaPower === 0)
            result += '1';
          else if (alphaPower === 1)
            result += 'a';
          else {
            result += 'a^';
            result += 'alphaPower';
          }
        }
        if (degree !== 0) {
          if (degree === 1)
            result += 'x';
          else
            result += 'x^';
            result += degree;
        }
      }
    }

    return result;
  }
}
