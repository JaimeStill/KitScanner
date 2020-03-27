import { FinderPattern } from './finder-pattern';

export class FinderPatternInfo {
  private bottomLeft: FinderPattern;
  private topLeft: FinderPattern;
  private topRight: FinderPattern;

  public constructor(patternCenters: FinderPattern[]) {
    this.bottomLeft = patternCenters[0];
    this.topLeft = patternCenters[1];
    this.topRight = patternCenters[2];
  }

  public getBottomLeft = (): FinderPattern =>  this.bottomLeft;
  public getTopLeft = (): FinderPattern => this.topLeft;
  public getTopRight = (): FinderPattern => this.topRight;
}
