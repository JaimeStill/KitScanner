import { AlignmentPattern } from './alignment-pattern';
import { ResultPointCallback } from '../../result-point-callback';
import { BitMatrix } from '../../common/bit-matrix';
import { NotFoundException } from '../../exception/not-found-exception';

export class AlignmentPatternFinder {
  private possibleCenters: AlignmentPattern[];
  private crossCheckStateCount: Int32Array;

  constructor(
    private image: BitMatrix,
    private startX: number,
    private startY: number,
    private width: number,
    private height: number,
    private moduleSize: number,
    private resultPointCallback: ResultPointCallback
  ) {
    this.possibleCenters = [];
    this.crossCheckStateCount = new Int32Array(3);
  }

  private static centerFromEnd = (stateCount: Int32Array, end: number) =>
    (end - stateCount[2]) - stateCount[1] / 2.0;

  private foundPatternCross = (stateCount: Int32Array) => {
    const maxVariance = this.moduleSize / 2.0;

    for (let i = 0; i < 3; i++)
      if (Math.abs(this.moduleSize - stateCount[i]) >= maxVariance)
        return false;

    return true;
  }

  private crossCheckVertical = (
    startI: number,
    centerJ: number,
    maxCount: number,
    originalStateCountTotal: number
  ) => {
    const maxI = this.image.getHeight();
    const stateCount = this.crossCheckStateCount;

    stateCount[0] = 0;
    stateCount[1] = 0;
    stateCount[2] = 0;

    let i = startI;

    while (i >= 0 && this.image.get(centerJ, i) && stateCount[1] <= maxCount) {
      stateCount[1]++;
      i--;
    }

    if (i < 0 || stateCount[1] > maxCount)
      return NaN;

    while (i > 0 && !this.image.get(centerJ, i) && stateCount[0] <= maxCount) {
      stateCount[0]++;
      i--;
    }

    if (stateCount[0] > maxCount)
      return NaN;

    i = startI + 1;

    while (i < maxI && this.image.get(centerJ, i) && stateCount[1] <= maxCount) {
      stateCount[1]++;
      i++;
    }

    if (i === maxI || stateCount[1] > maxCount)
      return NaN;

    while (i < maxI && !this.image.get(centerJ, i) && stateCount[2] <= maxCount) {
      stateCount[2]++;
      i++;
    }

    if (stateCount[2] > maxCount)
      return NaN;

    const stateCountTotal = stateCount[0] + stateCount[1] + stateCount[2];

    if (5 * Math.abs(stateCountTotal - originalStateCountTotal) >= 2 * originalStateCountTotal)
      return NaN;

    return this.foundPatternCross(stateCount)
      ? AlignmentPatternFinder.centerFromEnd(stateCount, i)
      : NaN;
  }

  private handlePossibleCenter = (stateCount: Int32Array, i: number, j: number): AlignmentPattern => {
    const stateCountTotal = stateCount[0] + stateCount[1] + stateCount[2];
    const centerJ = AlignmentPatternFinder.centerFromEnd(stateCount, j);
    const centerI = this.crossCheckVertical(i, centerJ, 2 * stateCount[1], stateCountTotal);

    if (!isNaN(centerI)) {
      const estimatedModuleSize = (stateCount[0] + stateCount[1] + stateCount[2]) / 3.0;

      for (const center of this.possibleCenters)
        if (center.aboutEquals(estimatedModuleSize, centerI, centerJ))
          return center.combineEstimate(centerI, centerJ, estimatedModuleSize);

      const point = new AlignmentPattern(centerJ, centerI, estimatedModuleSize);
      this.possibleCenters.push(point);

      if (this.resultPointCallback !== null && this.resultPointCallback !== undefined)
        this.resultPointCallback.foundPossibleResultPoint(point);
    }

    return null;
  }

  find = (): AlignmentPattern => {
    const maxJ = this.startX + this.width;
    const middleI = this.startY + (this.height / 2);
    const stateCount = new Int32Array(3);

    for (let iGen = 0; iGen < this.height; iGen++) {
      const i = middleI + ((iGen & 0x01) === 0 ? Math.floor((iGen + 1) / 2) : -Math.floor((iGen + 1) / 2));

      stateCount[0] = 0;
      stateCount[1] = 0;
      stateCount[2] = 0;

      let j = this.startX;

      while (j < maxJ && !this.image.get(j, i))
        j++;

      let currentState = 0;

      while (j < maxJ) {
        if (this.image.get(j, i)) {
          if (currentState === 1)
            stateCount[1]++;
          else {
            if (currentState === 2) {
              if (this.foundPatternCross(stateCount)) {
                const confirmed = this.handlePossibleCenter(stateCount, i, j);

                if (confirmed !== null)
                  return confirmed;
              }

              stateCount[0] = stateCount[2];
              stateCount[1] = 1;
              stateCount[2] = 0;
              currentState = 1;
            } else
              stateCount[++currentState]++;
          }
        } else {
          if (currentState === 1)
            currentState++;

          stateCount[currentState]++;
        }

        j++;
      }

      if (this.foundPatternCross(stateCount)) {
        const confirmed = this.handlePossibleCenter(stateCount, i, maxJ);

        if (confirmed !== null)
          return confirmed;
      }
    }

    if (this.possibleCenters.length !== 0)
      return this.possibleCenters[0];

    throw new NotFoundException();
  }
}
