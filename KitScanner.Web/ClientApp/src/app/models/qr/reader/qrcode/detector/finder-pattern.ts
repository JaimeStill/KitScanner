import { ResultPoint } from '../../result-point';

export class FinderPattern extends ResultPoint {
  constructor(
    posX: number,
    posY: number,
    private estimatedModuleSize: number,
    private count?: number
  ) {
    super(posX, posY);

    if (undefined === count)
      this.count = 1;
  }

  getEstimatedModuleSize = () => this.estimatedModuleSize;
  getCount = () => this.count;

  aboutEquals = (moduleSize: number, i: number, j: number) => {
    if (Math.abs(i - this.getY()) <= moduleSize && Math.abs(j - this.getX()) < moduleSize) {
      const moduleSizeDiff = Math.abs(moduleSize - this.estimatedModuleSize);
      return moduleSizeDiff <= 1.0 || moduleSizeDiff <= this.estimatedModuleSize;
    }

    return false;
  }

  combineEstimate = (i: number, j: number, newModuleSize: number) => {
    const combinedCount = this.count + 1;
    const combinedX: number  = (this.count * this.getX() + j) / combinedCount;
    const combinedY: number  = (this.count * this.getY() + i) / combinedCount;
    const combinedModuleSize: number  = (this.count * this.estimatedModuleSize + newModuleSize) / combinedCount;
    return new FinderPattern(combinedX, combinedY, combinedModuleSize, combinedCount);
  }
}
