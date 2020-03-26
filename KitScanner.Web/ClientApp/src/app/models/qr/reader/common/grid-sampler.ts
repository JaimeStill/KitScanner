import { BitMatrix } from './bit-matrix';
import { PerspectiveTransform } from './perspective-transform';
import { NotFoundException } from '../exception/not-found-exception';

export abstract class GridSampler {
  protected static checkAndNudgePoints = (image: BitMatrix, points: Float32Array) => {
    const width = image.getWidth();
    const height = image.getHeight();

    let nudged = true;

    for (let offset = 0; offset < points.length && nudged; offset += 2) {
      const x = Math.floor(points[offset]);
      const y = Math.floor(points[offset + 1]);

      if (x < -1 || x > width || y < -1 || y > height)
        throw new NotFoundException();

      nudged = false;

      if (x === -1) {
        points[offset] = 0.0;
        nudged = true;
      } else if (x === width) {
        points[offset] = width - 1;
        nudged = true;
      }

      if (y === -1) {
        points[offset + 1] = 0.0;
        nudged = true;
      } else if (y === height) {
        points[offset + 1] = height - 1;
        nudged = true;
      }
    }

    nudged = true;

    for (let offset = points.length - 2; offset >= 0 && nudged; offset -= 2) {
      const x = Math.floor(points[offset]);
      const y = Math.floor(points[offset + 1]);

      if (x < -1 || x > width || y < -1 || y > height)
        throw new NotFoundException();

      nudged = false;

      if (x === -1) {
        points[offset] = 0.0;
        nudged = true;
      } else if (x === width) {
        points[offset] = width - 1;
        nudged = true;
      }

      if (y === -1) {
        points[offset + 1] = 0.0;
        nudged = true;
      } else if (y === height) {
        points[offset + 1] = height - 1;
        nudged = true;
      }
    }
  }

  abstract sampleGrid(
    image: BitMatrix,
    dimensionX: number,
    dimensionY: number,
    p1ToX: number, p1ToY: number,
    p2ToX: number, p2ToY: number,
    p3ToX: number, p3ToY: number,
    p4ToX: number, p4ToY: number,
    p1FromX: number, p1FromY: number,
    p2FromX: number, p2FromY: number,
    p3FromX: number, p3FromY: number,
    p4FromX: number, p4FromY: number
  ): BitMatrix;

  abstract sampleGridWithTransform(
    image: BitMatrix,
    dimensionX: number,
    dimensionY: number,
    transform: PerspectiveTransform
  ): BitMatrix;
}
