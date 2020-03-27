import { GenericGf } from './generic-gf';
import { GenericGfPoly } from './generic-gf-poly';
import { IllegalStateException } from '../../exception/illegal-state-exception';
import { ReedSolomonException } from '../../exception/reed-solomon-exception';

export class ReedSolomonDecoder {
  constructor(
    private field: GenericGf
  ) { }

  decode = (received: Int32Array, twoS: number): void => {
    const poly = new GenericGfPoly(this.field, received);
    const syndromeCoefficients = new Int32Array(twoS);
    let noError = true;

    for (let i = 0; i < twoS; i++) {
      const evalResult = poly.evaluateAt(this.field.exp(i + this.field.getGeneratorBase()));
      syndromeCoefficients[syndromeCoefficients.length - 1 - i] = evalResult;

      if (evalResult !== 0)
        noError = false;
    }

    if (noError) return;

    const syndrome = new GenericGfPoly(this.field, syndromeCoefficients);
    const sigmaOmega = this.runEuclideanAlgorithm(this.field.buildMonomial(twoS, 1), syndrome, twoS);
    const sigma = sigmaOmega[0];
    const omega = sigmaOmega[1];
    const errorLocations = this.findErrorLocations(sigma);
    const errorMagnitudes = this.findErrorMagnitudes(omega, errorLocations);

    for (let i = 0; i < errorLocations.length; i++) {
      const position = received.length - 1 - this.field.log(errorLocations[i]);

      if (position < 0)
        throw new ReedSolomonException('Bad error location');

      received[position] = GenericGf.addOrSubtract(received[position], errorMagnitudes[i]);
    }
  }

  private runEuclideanAlgorithm = (a: GenericGfPoly, b: GenericGfPoly, R: number): GenericGfPoly[] => {
    if (a.getDegree() < b.getDegree()) {
      const temp = a;
      a = b;
      b = temp;
    }

    let rLast = a;
    let r = b;
    let tLast = this.field.getZero();
    let t = this.field.getOne();

    while (r.getDegree() >= (R / 2 | 0)) {
      let rLastLast = rLast;
      let tLastLast = tLast;
      rLast = r;
      tLast = t;

      if (rLast.isZero())
        throw new ReedSolomonException(`r_{i-1} was zero`);

      r = rLastLast;

      let q = this.field.getZero();
      const denominatorLeadingTerm = rLast.getCoefficient(rLast.getDegree());
      const dltInverse = this.field.inverse(denominatorLeadingTerm);

      while (r.getDegree() >= rLast.getDegree() && !r.isZero()) {
        const degreeDiff = r.getDegree() - rLast.getDegree();
        const scale = this.field.multiply(r.getCoefficient(r.getDegree()), dltInverse);
        q = q.addOrSubtract(this.field.buildMonomial(degreeDiff, scale));
        r = r.addOrSubtract(rLast.multiplyByMonomial(degreeDiff, scale));
      }

      t = q.multiply(tLast).addOrSubtract(tLastLast);

      if (r.getDegree() >= rLast.getDegree())
        throw new IllegalStateException('Division algorithm failed to reduce polynomial?');
    }

    const sigmaTildeAtZero = t.getCoefficient(0);

    if (sigmaTildeAtZero === 0)
      throw new ReedSolomonException('SigmaTilde(0) was zero');

    const inverse = this.field.inverse(sigmaTildeAtZero);
    const sigma = t.multiplyScalar(inverse);
    const omega = r.multiplyScalar(inverse);
    return [sigma, omega];
  }

  private findErrorLocations = (errorLocator: GenericGfPoly): Int32Array => {
    const numErrors = errorLocator.getDegree();

    if (numErrors === 1)
      return Int32Array.from([errorLocator.getCoefficient(1)]);

    const result = new Int32Array(numErrors);
    let e = 0;

    for (let i = 1; i < this.field.getSize() && e < numErrors; i++) {
      if (errorLocator.evaluateAt(i) === 0) {
        result[e] = this.field.inverse(i);
        e++;
      }
    }

    if (e !== numErrors)
      throw new ReedSolomonException('Error: locator degree does not match number of roots');

    return result;
  }

  private findErrorMagnitudes = (errorEvaluator: GenericGfPoly, errorLocations: Int32Array): Int32Array => {
    const result = new Int32Array(errorLocations.length);

    for (let i = 0; i < errorLocations.length; i++) {
      const xiInverse = this.field.inverse(errorLocations[i]);
      let denominator = 1;

      for (let j = 0; j < errorLocations.length; j++) {
        if (i !== j) {
          const term = this.field.multiply(errorLocations[j], xiInverse);
          const termPlus1 = (term & 0x1) === 0
            ? term | 1
            : term & ~1;

          denominator = this.field.multiply(denominator, termPlus1);
        }
      }

      result[i] = this.field.multiply(errorEvaluator.evaluateAt(xiInverse), this.field.inverse(denominator));

      if (this.field.getGeneratorBase() !== 0)
        result[i] = this.field.multiply(result[i], xiInverse);
    }

    return result;
  }
}
