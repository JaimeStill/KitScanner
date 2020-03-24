import { ResultPoint } from './result-point';

export interface ResultPointCallback {
  foundPossibleResultPoint(point: ResultPoint): void;
}
