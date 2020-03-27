import { BitMatrix } from './bit-matrix';
import { GlobalHistogramBinarizer } from './global-histogram-binarizer';
import { Binarizer } from '../binarizer';
import { LuminanceSource } from '../luminance-source';

export class HybridBinarizer extends GlobalHistogramBinarizer {
  private static BLOCK_SIZE_POWER = 3;
  private static BLOCK_SIZE = 1 << HybridBinarizer.BLOCK_SIZE_POWER;
  private static BLOCK_SIZE_MASK = HybridBinarizer.BLOCK_SIZE - 1;
  private static MINIMUM_DIMENSION = HybridBinarizer.BLOCK_SIZE * 5;
  private static MIN_DYNAMIC_RANGE = 24;

  private matrix: BitMatrix | null = null;

  public constructor(source: LuminanceSource) {
    super (source);
  }

  private static calculateThresholdForBlock = (
    luminances: Uint8ClampedArray,
    subWidth: number,
    subHeight: number,
    width: number,
    height: number,
    blackPoints: Int32Array[],
    matrix: BitMatrix
  ) => {
    const maxYOffset = height - HybridBinarizer.BLOCK_SIZE;
    const maxXOffset = width - HybridBinarizer.BLOCK_SIZE;

    for (let y = 0; y < subHeight; y++) {
      let yoffset = y << HybridBinarizer.BLOCK_SIZE_POWER;

      if (yoffset > maxYOffset)
        yoffset = maxYOffset;

      const top = HybridBinarizer.cap(y, 2, subHeight - 3);

      for (let x = 0; x < subWidth; x++) {
        let xoffset = x << HybridBinarizer.BLOCK_SIZE_POWER;

        if (xoffset > maxXOffset)
          xoffset = maxXOffset;

        const left = HybridBinarizer.cap(x, 2, subWidth - 3);
        let sum = 0;

        for (let z = -2; z <= 2; z++) {
          const blackRow = blackPoints[top + z];
          sum += blackRow[left - 2] + blackRow[left - 1] + blackRow[left] + blackRow[left + 1] + blackRow[left + 2];
        }

        const average = sum / 25;
        HybridBinarizer.thresholdBlock(luminances, xoffset, yoffset, average, width, matrix);
      }
    }
  }

  private static cap = (value: number, min: number, max: number) => value < min
    ? min
    : value > max
      ? max
      : value;

  private static thresholdBlock = (
    luminances: Uint8ClampedArray,
    xoffset: number,
    yoffset: number,
    threshold: number,
    stride: number,
    matrix: BitMatrix
  ) => {
    for (let y = 0, offset = yoffset * stride + xoffset; y < HybridBinarizer.BLOCK_SIZE; y++, offset += stride)
      for (let x = 0; x < HybridBinarizer.BLOCK_SIZE; x++)
        if ((luminances[offset + x] & 0xff) <= threshold)
          matrix.set(xoffset + x, yoffset + y);
  }

  private static calculateBlackPoints = (
    luminances: Uint8ClampedArray,
    subWidth: number,
    subHeight: number,
    width: number,
    height: number
  ): Int32Array[] => {
    const maxYOffset = height - HybridBinarizer.BLOCK_SIZE;
    const maxXOffset = width - HybridBinarizer.BLOCK_SIZE;
    const blackPoints = new Array<Int32Array>(subHeight);

    for (let y = 0; y < subHeight; y++) {
      blackPoints[y] = new Int32Array(subWidth);
      let yoffset = y << HybridBinarizer.BLOCK_SIZE_POWER;

      if (yoffset > maxYOffset)
        yoffset = maxYOffset;

      for (let x = 0; x < subWidth; x++) {
        let xoffset = x << HybridBinarizer.BLOCK_SIZE_POWER;

        if (xoffset > maxXOffset)
          xoffset = maxXOffset;

        let sum = 0;
        let min = 0xff;
        let max = 0;

        for (let yy = 0, offset = yoffset * width + xoffset; yy < HybridBinarizer.BLOCK_SIZE; yy++, offset += width) {
          for (let xx = 0; xx < HybridBinarizer.BLOCK_SIZE; xx++) {
            const pixel = luminances[offset + xx] & 0xff;
            sum += pixel;

            if (pixel < min)
              min = pixel;

            if (pixel > max)
              max = pixel;
          }

          if (max - min > HybridBinarizer.MIN_DYNAMIC_RANGE) {
            for (yy++, offset += width; yy < HybridBinarizer.BLOCK_SIZE; yy++, offset += width) {
              for (let xx = 0; xx < HybridBinarizer.BLOCK_SIZE; xx++)
                sum += luminances[offset + xx] & 0xff;
            }
          }
        }

        let average = sum >> (HybridBinarizer.BLOCK_SIZE_POWER * 2);

        if (max - min <= HybridBinarizer.MIN_DYNAMIC_RANGE) {
          average = min / 2;

          if (y > 0 && x > 0) {
            const averageNeighborBlackPoint = (blackPoints[y - 1][x] + (2 * blackPoints[y][x - 1]) + blackPoints[y - 1][x - 1]) / 4;

            if (min < averageNeighborBlackPoint)
              average = averageNeighborBlackPoint;
          }
        }

        blackPoints[y][x] = average;
      }
    }

    return blackPoints;
  }

  createBinarizer  = (source: LuminanceSource): Binarizer => new HybridBinarizer(source);

  getBlackMatrix = (): BitMatrix => {
    if (this.matrix !== null)
      return this.matrix;

    const source = this.getLuminanceSource();
    const width = source.getWidth();
    const height = source.getHeight();

    if (width >= HybridBinarizer.MINIMUM_DIMENSION && height >= HybridBinarizer.MINIMUM_DIMENSION) {
      const luminances = source.getMatrix();
      let subWidth = width >> HybridBinarizer.BLOCK_SIZE_POWER;

      if ((width & HybridBinarizer.BLOCK_SIZE_MASK) !== 0)
        subWidth++;

      let subHeight = height >> HybridBinarizer.BLOCK_SIZE_POWER;

      if ((height & HybridBinarizer.BLOCK_SIZE_MASK) !== 0)
        subHeight++;

      const blackPoints = HybridBinarizer.calculateBlackPoints(luminances, subWidth, subHeight, width, height);

      const newMatrix = new BitMatrix(width, height);
      HybridBinarizer.calculateThresholdForBlock(luminances, subWidth, subHeight, width, height, blackPoints, newMatrix);
      this.matrix = newMatrix;
    } else
      this.matrix = super.getBlackMatrix();

    return this.matrix;
  }
}
