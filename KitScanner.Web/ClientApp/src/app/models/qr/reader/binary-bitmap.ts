import { Binarizer } from './binarizer';

import { BitArray } from './common/bit-array';
import { BitMatrix } from './common/bit-matrix';

import { IllegalArgumentException } from './exception/illegal-argument-exception';

export class BinaryBitmap {
  private matrix: BitMatrix;

  constructor(
    private binarizer: Binarizer
  ) {
    if (binarizer === null)
      throw new IllegalArgumentException('Binarizer must be non-null.');
  }

  getWidth = () => this.binarizer.getWidth();

  getHeight = () => this.binarizer.getHeight();

  getBlackRow = (y: number, row: BitArray) => this.binarizer.getBlackRow(y, row);

  getBlackMatrix = () => {
    this.matrix = this.matrix
      ? this.matrix
      : this.binarizer.getBlackMatrix();

    return this.matrix
  }

  isCropSupported = () => this.binarizer
    .getLuminanceSource()
    .isCropSupported();

  crop = (left: number, top: number, width: number, height: number) => {
    const newSource = this.binarizer
      .getLuminanceSource()
      .crop(left, top, width, height);

    return new BinaryBitmap(this.binarizer.createBinarizer(newSource));
  }

  isRotateSupported = () => this.binarizer
    .getLuminanceSource()
    .isRotateSupported();

  rotateCounterClockwise = () => {
    const newSource = this.binarizer
      .getLuminanceSource()
      .rotateCounterClockwise();

    return new BinaryBitmap(this.binarizer.createBinarizer(newSource));
  }

  rotateCounterClockwise45 = () => {
    const newSource = this.binarizer
      .getLuminanceSource()
      .rotateCounterClockwise45();

    return new BinaryBitmap(this.binarizer.createBinarizer(newSource));
  }

  toString = () => {
    try {
      return this.getBlackMatrix().toString();
    } catch (e) { return e; }
  }
}
