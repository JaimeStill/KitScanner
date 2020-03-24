export class MathUtils {
  public static distance(aX: number, aY: number, bX: number, bY: number): number {
    const xDiff = aX - bX;
    const yDiff = aY - bY;

    return Math.sqrt(xDiff * xDiff + yDiff * yDiff);
  }

  public static sum = (array: Int32Array): number => array.reduce((sum, curr) => sum += curr);

  private MathUtils() { }
}
