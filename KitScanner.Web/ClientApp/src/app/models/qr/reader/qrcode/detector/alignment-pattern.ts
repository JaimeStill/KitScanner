import { ResultPoint } from '../../result-point';

export class AlignmentPattern extends ResultPoint {
  constructor(
    posX: number,
    posY: number,
    private estimatedModuleSize: number
  ) {
    super(posX, posY);
  }

  aboutEquals = (moduleSize: number, i: number, j: number) => {
    if (Math.abs(i - this.getY()) <= moduleSize && Math.abs(j - this.getX()) < moduleSize) {
      const moduleSizeDiff = Math.abs(moduleSize - this.estimatedModuleSize);
      return moduleSizeDiff <= 1.0 || moduleSizeDiff <= this.estimatedModuleSize;
    }

    return false;
  }

  combineEstimate = (i: number, j: number, newModuleSize: number) => {
    const combinedX = (this.getX() + j) / 2.0;
    const combinedY = (this.getY() + i) / 2.0;
    const combinedModuleSize = (this.estimatedModuleSize + newModuleSize) / 2.0;
    return new AlignmentPattern(combinedX, combinedY, combinedModuleSize);
  }
}
