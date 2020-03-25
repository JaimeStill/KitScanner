import { UnsupportedOperationException } from './exception/unsupported-operation-exception';
import { StringBuilder } from './util/string-builder';

export abstract class LuminanceSource {
  protected constructor(
    private width: number,
    private height: number
  ) { }

  abstract getRow(y: number, row?: Uint8ClampedArray): Uint8ClampedArray;

  abstract getMatrix(): Uint8ClampedArray;

  getWidth = () => this.width;

  getHeight = () => this.height;

  isCropSupported = () => false;

  crop(left: number, top: number, width: number, height: number): LuminanceSource {
    throw new UnsupportedOperationException('This luminance source does not support cropping.');
  }

  public isRotateSupported = () => false;

  abstract invert(): LuminanceSource;

  rotateCounterClockwise(): LuminanceSource {
    throw new UnsupportedOperationException('This luminance source does not support rotation by 90 degrees.');
  }

  rotateCounterClockwise45(): LuminanceSource {
    throw new UnsupportedOperationException('This luminance source does not support rotation by 45 degrees.');
  }

  toString(): string {
    const row = new Uint8ClampedArray(this.width);
    let result = new StringBuilder();

    for (let y = 0; y < this.height; y++) {
      const sourceRow = this.getRow(y, row);
      for (let x = 0; x < this.width; x++) {
        const luminance = sourceRow[x] & 0xFF;
        let c: string;

        if (luminance < 0x40) {
          c = '#';
        } else if (luminance < 0x80) {
          c = '+';
        } else if (luminance < 0xc0) {
          c = '.';
        } else {
          c = ' ';
        }

        result.append(c);
      }

      result.append('\n');
    }

    return result.toString();
  }
}
