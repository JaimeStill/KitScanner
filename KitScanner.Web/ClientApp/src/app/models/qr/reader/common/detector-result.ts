import { BitMatrix } from './bit-matrix';
import { ResultPoint } from '../result-point';

export class DetectorResult {
  private bits: BitMatrix;
  private points: Array<ResultPoint>;

  constructor(bits: BitMatrix, points: Array<ResultPoint>) {
    this.bits = bits;
    this.points = points;
  }

  getBits = () => this.bits;
  getPoints = () => this.points;
}
