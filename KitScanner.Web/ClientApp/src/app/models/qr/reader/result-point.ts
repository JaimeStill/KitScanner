import { MathUtils } from './common/math-utils';
import { Float } from './util/float';

export class ResultPoint {
  constructor(
    private x: float,
    private y: float
  ) { }

  private static crossProductZ = (
    pointA: ResultPoint,
    pointB: ResultPoint,
    pointC: ResultPoint
  ) => {
    const bX = pointB.x;
    const bY = pointB.y;

    return ((pointC.x - bX) * (pointA.y - bY)) - ((pointC.y - bY) * (pointA.x - bX));
  }

  static distance = (pattern1: ResultPoint, pattern2: ResultPoint) => MathUtils.distance(pattern1.x, pattern1.y, pattern2.x, pattern2.y);

  static orderBestPatterns = (patterns: Array<ResultPoint>) => {
    const zeroOneDistance = ResultPoint.distance(patterns[0], patterns[1]);
    const oneTwoDistance = ResultPoint.distance(patterns[1], patterns[2]);
    const zeroTwoDistance = ResultPoint.distance(patterns[0], patterns[2]);

    let pointA: ResultPoint;
    let pointB: ResultPoint;
    let pointC: ResultPoint;

    if (oneTwoDistance >= zeroOneDistance && oneTwoDistance >= zeroTwoDistance) {
      pointB = patterns[0];
      pointA = patterns[1];
      pointC = patterns[2];
    } else if (zeroTwoDistance >= oneTwoDistance && zeroTwoDistance >= zeroOneDistance) {
      pointB = patterns[1];
      pointA = patterns[0];
      pointC = patterns[2];
    } else {
      pointB = patterns[2];
      pointA = patterns[0];
      pointC = patterns[1];
    }

    if (ResultPoint.crossProductZ(pointA, pointB, pointC) < 0.0) {
      const temp = pointA;
      pointA = pointC;
      pointC = temp;
    }

    patterns[0] = pointA;
    patterns[1] = pointB;
    patterns[2] = pointC;
  }

  getX = () => this.x;

  getY = () => this.y;

  equals = (other: Object) => {
    if (other instanceof ResultPoint) {
      const otherPoint = <ResultPoint>other;
      return this.x === otherPoint.x && this.y === otherPoint.y;
    }

    return false;
  }

  hashCode = () => 31 * Float.floatToIntBits(this.x) + Float.floatToIntBits(this.y);

  toString = () => `(${this.x},${this.y})`;
}
