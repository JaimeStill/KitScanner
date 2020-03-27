export class MathUtils {
  static round = (d: number): number => Math.round(d);

  static distance(aX: number, aY: number, bX: number, bY: number): number {
    const xDiff = aX - bX;
    const yDiff = aY - bY;

    return Math.sqrt(xDiff * xDiff + yDiff * yDiff);
  }

  static sum = (array: Int32Array): number => array.reduce((sum, curr) => sum += curr);

  private MathUtils() { }
}
