import { LuminanceSource } from './luminance-source';

import { BitArray } from './common/bit-array';
import { BitMatrix } from './common/bit-matrix';

export abstract class Binarizer {
  constructor(
    private source: LuminanceSource
  ) { }

  getLuminanceSource = () => this.source;

  abstract getBlackRow(y: number, row: BitArray): BitArray;

  abstract getBlackMatrix(): BitMatrix;

  abstract createBinarizer(source: LuminanceSource): Binarizer;

  getWidth = () => this.source.getWidth();

  getHeight = () => this.source.getHeight();
}
