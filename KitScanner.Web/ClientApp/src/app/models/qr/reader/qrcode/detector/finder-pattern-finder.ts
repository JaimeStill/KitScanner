import { FinderPattern } from './finder-pattern';
import { FinderPatternInfo } from './finder-pattern-info';
import { DecodeHintType } from '../../decode-hint-type';
import { ResultPoint } from '../../result-point';
import { ResultPointCallback } from '../../result-point-callback';
import { BitMatrix } from '../../common/bit-matrix';
import { NotFoundException } from '../../exception/not-found-exception';

export class FinderPatternFinder {
  private static CENTER_QUORUM = 2;
  protected static MIN_SKIP = 3;
  protected static MAX_MODULES = 57;

  private possibleCenters: FinderPattern[];
  private hasSkipped: boolean;
  private crossCheckStateCount: Int32Array;

  public constructor(
    private image: BitMatrix,
    private resultPointCallback: ResultPointCallback
  ) {
    this.possibleCenters = [];
    this.crossCheckStateCount = new Int32Array(5);
    this.resultPointCallback = resultPointCallback;
  }

  private static centerFromEnd = (stateCount: Int32Array, end: number) =>
    (end - stateCount[4] - stateCount[3]) - stateCount[2] / 2.0;

  protected static foundPatternCross = (stateCount: Int32Array) => {
    let totalModuleSize = 0;

    for (let i = 0; i < 5; i++) {
      const count = stateCount[i];

      if (count === 0)
        return false;

      totalModuleSize += count;
    }

    if (totalModuleSize < 7)
      return false;

    const moduleSize: number = totalModuleSize / 7.0;
    const maxVariance: number = moduleSize / 2.0;

    return Math.abs(moduleSize - stateCount[0]) < maxVariance &&
      Math.abs(moduleSize - stateCount[1]) < maxVariance &&
      Math.abs(3.0 * moduleSize - stateCount[2]) < 3 * maxVariance &&
      Math.abs(moduleSize - stateCount[3]) < maxVariance &&
      Math.abs(moduleSize - stateCount[4]) < maxVariance;
  }

  private getCrossCheckStateCount = () => {
    const crossCheckStateCount = this.crossCheckStateCount;

    crossCheckStateCount[0] = 0;
    crossCheckStateCount[1] = 0;
    crossCheckStateCount[2] = 0;
    crossCheckStateCount[3] = 0;
    crossCheckStateCount[4] = 0;

    return crossCheckStateCount;
  }

  private crossCheckDiagonal = (startI: number, centerJ: number, maxCount: number, originalStateCountTotal: number) => {
    const stateCount: Int32Array = this.getCrossCheckStateCount();

    let i = 0;
    const image = this.image;

    while (startI >= i && centerJ >= i && image.get(centerJ - i, startI - i)) {
      stateCount[2]++;
      i++;
    }

    if (startI < i || centerJ < i)
      return false;

    while (
      startI >= i && centerJ >= i && !image.get(centerJ - i, startI - i) &&
      stateCount[1] <= maxCount
    ) {
      stateCount[1]++;
      i++;
    }

    if (startI < i || centerJ < i || stateCount[1] > maxCount)
      return false;

    while (
      startI >= i && centerJ >= i && image.get(centerJ - i, startI - i) &&
      stateCount[0] <= maxCount
    ) {
      stateCount[0]++;
      i++;
    }

    if (stateCount[0] > maxCount)
      return false;

    const maxI = image.getHeight();
    const maxJ = image.getWidth();

    i = 1;
    while (startI + i < maxI && centerJ + i < maxJ && image.get(centerJ + i, startI + i)) {
      stateCount[2]++;
      i++;
    }

    if (startI + i >= maxI || centerJ + i >= maxJ)
      return false;

    while (
      startI + i < maxI && centerJ + i < maxJ && !image.get(centerJ + i, startI + i) &&
      stateCount[3] < maxCount
    ) {
      stateCount[3]++;
      i++;
    }

    if (startI + i >= maxI || centerJ + i >= maxJ || stateCount[3] >= maxCount)
      return false;

    while (
      startI + i < maxI && centerJ + i < maxJ && image.get(centerJ + i, startI + i) &&
      stateCount[4] < maxCount
    ) {
      stateCount[4]++;
      i++;
    }

    if (stateCount[4] >= maxCount)
      return false;

    const stateCountTotal = stateCount[0] + stateCount[1] + stateCount[2] + stateCount[3] + stateCount[4];

    return Math.abs(stateCountTotal - originalStateCountTotal) < 2 * originalStateCountTotal &&
      FinderPatternFinder.foundPatternCross(stateCount);
  }

  private crossCheckVertical = (
    startI: number,
    centerJ: number,
    maxCount: number,
    originalStateCountTotal: number
  ) => {
    const image: BitMatrix = this.image;

    const maxI = image.getHeight();
    const stateCount: Int32Array = this.getCrossCheckStateCount();

    let i = startI;

    while (i >= 0 && image.get(centerJ, i)) {
      stateCount[2]++;
      i--;
    }

    if (i < 0)
      return NaN;

    while (i >= 0 && !image.get(centerJ, i) && stateCount[1] <= maxCount) {
      stateCount[1]++;
      i--;
    }

    if (i < 0 || stateCount[1] > maxCount)
      return NaN;

    while (i >= 0 && image.get(centerJ, i) && stateCount[0] <= maxCount) {
      stateCount[0]++;
      i--;
    }

    if (stateCount[0] > maxCount)
      return NaN;

    i = startI + 1;

    while (i < maxI && image.get(centerJ, i)) {
      stateCount[2]++;
      i++;
    }

    if (i === maxI)
      return NaN;

    while (i < maxI && !image.get(centerJ, i) && stateCount[3] < maxCount) {
      stateCount[3]++;
      i++;
    }

    if (i === maxI || stateCount[3] >= maxCount)
      return NaN;

    while (i < maxI && image.get(centerJ, i) && stateCount[4] < maxCount) {
      stateCount[4]++;
      i++;
    }

    if (stateCount[4] >= maxCount)
      return NaN;

    const stateCountTotal = stateCount[0] + stateCount[1] + stateCount[2] + stateCount[3] + stateCount[4];

    if (5 * Math.abs(stateCountTotal - originalStateCountTotal) >= 2 * originalStateCountTotal)
      return NaN;

    return FinderPatternFinder.foundPatternCross(stateCount) ? FinderPatternFinder.centerFromEnd(stateCount, i) : NaN;
  }

  private crossCheckHorizontal = (
    startJ: number,
    centerI: number,
    maxCount: number,
    originalStateCountTotal: number
  ) => {
    const image: BitMatrix = this.image;

    const maxJ = image.getWidth();
    const stateCount: Int32Array = this.getCrossCheckStateCount();

    let j = startJ;

    while (j >= 0 && image.get(j, centerI)) {
      stateCount[2]++;
      j--;
    }

    if (j < 0)
      return NaN;

    while (j >= 0 && !image.get(j, centerI) && stateCount[1] <= maxCount) {
      stateCount[1]++;
      j--;
    }

    if (j < 0 || stateCount[1] > maxCount)
      return NaN;

    while (j >= 0 && image.get(j, centerI) && stateCount[0] <= maxCount) {
      stateCount[0]++;
      j--;
    }

    if (stateCount[0] > maxCount)
      return NaN;

    j = startJ + 1;

    while (j < maxJ && image.get(j, centerI)) {
      stateCount[2]++;
      j++;
    }

    if (j === maxJ)
      return NaN;

    while (j < maxJ && !image.get(j, centerI) && stateCount[3] < maxCount) {
      stateCount[3]++;
      j++;
    }

    if (j === maxJ || stateCount[3] >= maxCount)
      return NaN;

    while (j < maxJ && image.get(j, centerI) && stateCount[4] < maxCount) {
      stateCount[4]++;
      j++;
    }

    if (stateCount[4] >= maxCount)
      return NaN;

    const stateCountTotal = stateCount[0] + stateCount[1] + stateCount[2] + stateCount[3] + stateCount[4];

    if (5 * Math.abs(stateCountTotal - originalStateCountTotal) >= originalStateCountTotal)
      return NaN;

    return FinderPatternFinder.foundPatternCross(stateCount) ? FinderPatternFinder.centerFromEnd(stateCount, j) : NaN;
  }

  private findRowSkip = () => {
    const max = this.possibleCenters.length;

    if (max <= 1)
      return 0;

    let firstConfirmedCenter: ResultPoint = null;
    for (const center of this.possibleCenters) {
      if (center.getCount() >= FinderPatternFinder.CENTER_QUORUM) {
        if (firstConfirmedCenter == null)
          firstConfirmedCenter = center;
        else {
          this.hasSkipped = true;

          return Math.floor((Math.abs(firstConfirmedCenter.getX() - center.getX()) - Math.abs(firstConfirmedCenter.getY() - center.getY())) / 2);
        }
      }
    }

    return 0;
  }

  private haveMultiplyConfirmedCenters = () => {
    let confirmedCount = 0;
    let totalModuleSize = 0.0;
    const max = this.possibleCenters.length;

    for (const pattern of this.possibleCenters)
      if (pattern.getCount() >= FinderPatternFinder.CENTER_QUORUM) {
        confirmedCount++;
        totalModuleSize += pattern.getEstimatedModuleSize();
      }

    if (confirmedCount < 3)
      return false;

    const average = totalModuleSize / max;
    let totalDeviation = 0.0;

    for (const pattern of this.possibleCenters)
      totalDeviation += Math.abs(pattern.getEstimatedModuleSize() - average);

    return totalDeviation <= 0.05 * totalModuleSize;
  }

  private selectBestPatterns = () => {
    const startSize = this.possibleCenters.length;

    if (startSize < 3)
      throw new NotFoundException();

    const possibleCenters = this.possibleCenters;

    let average: float;

    if (startSize > 3) {
      let totalModuleSize: float = 0.0;
      let square: float = 0.0;

      for (const center of this.possibleCenters) {
        const size: float = center.getEstimatedModuleSize();
        totalModuleSize += size;
        square += size * size;
      }

      average = totalModuleSize / startSize;
      let stdDev: float = <float>Math.sqrt(square / startSize - average * average);

      possibleCenters.sort(
        (center1: FinderPattern, center2: FinderPattern) => {
          const dA: float = Math.abs(center2.getEstimatedModuleSize() - average);
          const dB: float = Math.abs(center1.getEstimatedModuleSize() - average);
          return dA < dB ? -1 : dA > dB ? 1 : 0;
        });

      const limit: float = Math.max(0.2 * average, stdDev);

      for (let i = 0; i < possibleCenters.length && possibleCenters.length > 3; i++) {
        const pattern: FinderPattern = possibleCenters[i];
        if (Math.abs(pattern.getEstimatedModuleSize() - average) > limit) {
          possibleCenters.splice(i, 1);
          i--;
        }
      }
    }

    if (possibleCenters.length > 3) {
      let totalModuleSize: float = 0.0;
      for (const possibleCenter of possibleCenters)
        totalModuleSize += possibleCenter.getEstimatedModuleSize();

      average = totalModuleSize / possibleCenters.length;

      possibleCenters.sort(
        (center1: FinderPattern, center2: FinderPattern) => {
          if (center2.getCount() === center1.getCount()) {
            const dA: float = Math.abs(center2.getEstimatedModuleSize() - average);
            const dB: float = Math.abs(center1.getEstimatedModuleSize() - average);
            return dA < dB ? 1 : dA > dB ? -1 : 0;
          } else {
            return center2.getCount() - center1.getCount();
          }
        });

      possibleCenters.splice(3); // this is not realy necessary as we only return first 3 anyway
    }

    return [
      possibleCenters[0],
      possibleCenters[1],
      possibleCenters[2]
    ];
  }

  protected handlePossibleCenter = (
    stateCount: Int32Array,
    i: number,
    j: number,
    pureBarcode: boolean
  ) => {
    const stateCountTotal = stateCount[0] + stateCount[1] + stateCount[2] + stateCount[3] + stateCount[4];
    let centerJ: number = FinderPatternFinder.centerFromEnd(stateCount, j);
    let centerI: number = this.crossCheckVertical(i, Math.floor(centerJ), stateCount[2], stateCountTotal);

    if (!isNaN(centerI)) {
      centerJ = this.crossCheckHorizontal(Math.floor(centerJ), Math.floor(centerI), stateCount[2], stateCountTotal);

      if (
        !isNaN(centerJ) &&
        (!pureBarcode || this.crossCheckDiagonal(Math.floor(centerI), Math.floor(centerJ), stateCount[2], stateCountTotal))
      ) {
        const estimatedModuleSize: number = stateCountTotal / 7.0;
        let found = false;
        const possibleCenters = this.possibleCenters;

        for (let index = 0, length = possibleCenters.length; index < length; index++) {
          const center: FinderPattern = possibleCenters[index];

          if (center.aboutEquals(estimatedModuleSize, centerI, centerJ)) {
            possibleCenters[index] = center.combineEstimate(centerI, centerJ, estimatedModuleSize);
            found = true;
            break;
          }
        }
        if (!found) {
          const point: FinderPattern = new FinderPattern(centerJ, centerI, estimatedModuleSize);
          possibleCenters.push(point);
          if (this.resultPointCallback !== null && this.resultPointCallback !== undefined)
            this.resultPointCallback.foundPossibleResultPoint(point);
        }

        return true;
      }
    }

    return false;
  }

  getImage = () => this.image;
  getPossibleCenters = () => this.possibleCenters;

  find = (hints: Map<DecodeHintType, any>) => {
    const tryHarder: boolean = (hints !== null && hints !== undefined) && undefined !== hints.get(DecodeHintType.TRY_HARDER);
    const pureBarcode: boolean = (hints !== null && hints !== undefined) && undefined !== hints.get(DecodeHintType.PURE_BARCODE);
    const image = this.image;
    const maxI = image.getHeight();
    const maxJ = image.getWidth();

    let iSkip = Math.floor((3 * maxI) / (4 * FinderPatternFinder.MAX_MODULES));

    if (iSkip < FinderPatternFinder.MIN_SKIP || tryHarder)
      iSkip = FinderPatternFinder.MIN_SKIP;

    let done = false;
    const stateCount = new Int32Array(5);

    for (let i = iSkip - 1; i < maxI && !done; i += iSkip) {
      stateCount[0] = 0;
      stateCount[1] = 0;
      stateCount[2] = 0;
      stateCount[3] = 0;
      stateCount[4] = 0;

      let currentState = 0;

      for (let j = 0; j < maxJ; j++) {
        if (image.get(j, i)) {
          if ((currentState & 1) === 1)
            currentState++;

          stateCount[currentState]++;
        } else {
          if ((currentState & 1) === 0) {
            if (currentState === 4) {
              if (FinderPatternFinder.foundPatternCross(stateCount)) {
                const confirmed: boolean = this.handlePossibleCenter(stateCount, i, j, pureBarcode);
                if (confirmed === true) {
                  iSkip = 2;
                  if (this.hasSkipped === true)
                    done = this.haveMultiplyConfirmedCenters();
                  else {
                    const rowSkip = this.findRowSkip();
                    if (rowSkip > stateCount[2]) {
                      i += rowSkip - stateCount[2] - iSkip;
                      j = maxJ - 1;
                    }
                  }
                } else {
                  stateCount[0] = stateCount[2];
                  stateCount[1] = stateCount[3];
                  stateCount[2] = stateCount[4];
                  stateCount[3] = 1;
                  stateCount[4] = 0;
                  currentState = 3;
                  continue;
                }
                currentState = 0;
                stateCount[0] = 0;
                stateCount[1] = 0;
                stateCount[2] = 0;
                stateCount[3] = 0;
                stateCount[4] = 0;
              } else {
                stateCount[0] = stateCount[2];
                stateCount[1] = stateCount[3];
                stateCount[2] = stateCount[4];
                stateCount[3] = 1;
                stateCount[4] = 0;
                currentState = 3;
              }
            } else {
              stateCount[++currentState]++;
            }
          } else {
            stateCount[currentState]++;
          }
        }
      }

      if (FinderPatternFinder.foundPatternCross(stateCount)) {
        const confirmed: boolean = this.handlePossibleCenter(stateCount, i, maxJ, pureBarcode);

        if (confirmed === true) {
          iSkip = stateCount[0];

          if (this.hasSkipped)
            done = this.haveMultiplyConfirmedCenters();
        }
      }
    }

    const patternInfo: FinderPattern[] = this.selectBestPatterns();
    ResultPoint.orderBestPatterns(patternInfo);

    return new FinderPatternInfo(patternInfo);
  }
}
