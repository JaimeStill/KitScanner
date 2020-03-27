import { LuminanceSource } from './luminance-source';

export class InvertedLuminanceSource extends LuminanceSource {
  constructor(
    private delegate: LuminanceSource
  ) {
    super(delegate.getWidth(), delegate.getHeight());
  }

  getRow = (y: number, row?: Uint8ClampedArray) => {
    const sourceRow = this.delegate.getRow(y, row);
    const width = this.getWidth();

    for (let i = 0; i < width; i++)
      sourceRow[i] = (255 - (sourceRow[i] & 0xFF));

    return sourceRow;
  }

  getMatrix = () => {
    const matrix = this.delegate.getMatrix();
    const length = this.getWidth() * this.getHeight();
    const invertedMatrix = new Uint8ClampedArray(length);

    for (let i = 0; i < length; i++)
      invertedMatrix[i] = (255 - (matrix[i] & 0xFF));

    return invertedMatrix;
  }

  isCropSupported = () => this.delegate.isCropSupported();

  crop = (left: number, top: number, width: number, height: number) =>
    new InvertedLuminanceSource(this.delegate.crop(left, top, width, height));

  isRotateSupported = () => this.delegate.isRotateSupported();

  invert = () => this.delegate;

  rotateCounterClockwise = () => new InvertedLuminanceSource(this.delegate.rotateCounterClockwise());

  rotateCounterClockwise45 = () => new InvertedLuminanceSource(this.delegate.rotateCounterClockwise45());
}
