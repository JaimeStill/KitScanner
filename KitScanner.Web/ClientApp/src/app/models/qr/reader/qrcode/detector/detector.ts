import { AlignmentPattern } from './alignment-pattern';
import { AlignmentPatternFinder } from './alignment-pattern-finder';
import { FinderPatternFinder } from './finder-pattern-finder';
import { FinderPatternInfo } from './finder-pattern-info';
import { FinderPattern } from './finder-pattern';
import { Version } from '../decoder/version';
import { DecodeHintType } from '../../decode-hint-type';
import { ResultPoint } from '../../result-point';
import { ResultPointCallback } from '../../result-point-callback';
import { BitMatrix } from '../../common/bit-matrix';
import { DetectorResult } from '../../common/detector-result';
import { GridSamplerInstance } from '../../common/grid-sampler-instance';
import { MathUtils } from '../../common/math-utils';
import { PerspectiveTransform } from '../../common/perspective-transform';
import { NotFoundException } from '../../exception/not-found-exception';

export class Detector {
  private resultPointCallback: ResultPointCallback;

  public constructor(private image: BitMatrix) { }

  private static createTransform = (
    topLeft: ResultPoint,
    topRight: ResultPoint,
    bottomLeft: ResultPoint,
    alignmentPattern: ResultPoint,
    dimension: number
  ) => {
    const dimMinusThree = dimension - 3.5;
    let bottomRightX: number;
    let bottomRightY: number;
    let sourceBottomRightX: number;
    let sourceBottomRightY: number;

    if (alignmentPattern !== null) {
      bottomRightX = alignmentPattern.getX();
      bottomRightY = alignmentPattern.getY();
      sourceBottomRightX = dimMinusThree - 3.0;
      sourceBottomRightY = sourceBottomRightX;
    } else {
      bottomRightX = (topRight.getX() - topLeft.getX()) + bottomLeft.getX();
      bottomRightY = (topRight.getY() - topLeft.getY()) + bottomLeft.getY();
      sourceBottomRightX = dimMinusThree;
      sourceBottomRightY = dimMinusThree;
    }

    return PerspectiveTransform.quadrilateralToQuadrilateral(
      3.5,
      3.5,
      dimMinusThree,
      3.5,
      sourceBottomRightX,
      sourceBottomRightY,
      3.5,
      dimMinusThree,
      topLeft.getX(),
      topLeft.getY(),
      topRight.getX(),
      topRight.getY(),
      bottomRightX,
      bottomRightY,
      bottomLeft.getX(),
      bottomLeft.getY()
    );
  }

  private static sampleGrid = (image: BitMatrix, transform: PerspectiveTransform, dimension: number) => {
    const sampler = GridSamplerInstance.getInstance();
    return sampler.sampleGridWithTransform(image, dimension, dimension, transform);
  }

  private static computeDimension = (
    topLeft: ResultPoint,
    topRight: ResultPoint,
    bottomLeft: ResultPoint,
    moduleSize: number
  ) => {
    const tltrCentersDimension = MathUtils.round(ResultPoint.distance(topLeft, topRight) / moduleSize);
    const tlblCentersDimension = MathUtils.round(ResultPoint.distance(topLeft, bottomLeft) / moduleSize);
    let dimension = Math.floor((tltrCentersDimension + tlblCentersDimension) / 2) + 7;

    switch (dimension & 0x03) {
      case 0:
        dimension++;
        break;
      case 2:
        dimension--;
        break;
      case 3:
        throw new NotFoundException('Dimensions could be not found.');
    }

    return dimension;
  }

  private calculateModuleSizeOneWay = (
    pattern: ResultPoint,
    otherPattern: ResultPoint
  ) => {
    const moduleSizeEst1 = this.sizeOfBlackWhiteBlackRunBothWays(
      Math.floor(pattern.getX()),
      Math.floor(pattern.getY()),
      Math.floor(otherPattern.getX()),
      Math.floor(otherPattern.getY())
    );

    const moduleSizeEst2 = this.sizeOfBlackWhiteBlackRunBothWays(
      Math.floor(otherPattern.getX()),
      Math.floor(otherPattern.getY()),
      Math.floor(pattern.getX()),
      Math.floor(pattern.getY())
    );

    if (isNaN(moduleSizeEst1))
      return moduleSizeEst2 / 7.0;

    if (isNaN(moduleSizeEst2))
      return moduleSizeEst1 / 7.0;

    return (moduleSizeEst1 + moduleSizeEst2) / 14.0;
  }

  private sizeOfBlackWhiteBlackRunBothWays = (
    fromX: number, fromY: number,
    toX: number, toY: number
  ) => {
    let result = this.sizeOfBlackWhiteBlackRun(fromX, fromY, toX, toY);

    let scale = 1.0;
    let otherToX = fromX - (toX - fromX);

    if (otherToX < 0) {
      scale = fromX / (fromX - otherToX);
      otherToX = 0;
    } else if (otherToX >= this.image.getWidth()) {
      scale = (this.image.getWidth() - 1 - fromX) / (otherToX - fromX);
      otherToX = this.image.getWidth() - 1;
    }

    let otherToY = Math.floor(fromY - (toY - fromY) * scale);
    scale = 1.0;

    if (otherToY < 0) {
      scale = fromY / (fromY - otherToY);
      otherToY = 0;
    } else if (otherToY >= this.image.getHeight()) {
      scale = (this.image.getHeight() - 1 - fromY) / (otherToY - fromY);
      otherToY = this.image.getHeight() - 1;
    }

    otherToX = Math.floor(fromX + (otherToX - fromX) * scale);
    result += this.sizeOfBlackWhiteBlackRun(fromX, fromY, otherToX, otherToY);

    return result - 1.0;
  }

  private sizeOfBlackWhiteBlackRun = (
    fromX: number, fromY: number,
    toX: number, toY: number
  ) => {
    const steep: boolean = Math.abs(toY - fromY) > Math.abs(toX - fromX);

    if (steep) {
      let temp = fromX;
      fromX = fromY;
      fromY = temp;
      temp = toX;
      toX = toY;
      toY = temp;
    }

    const dx = Math.abs(toX - fromX);
    const dy = Math.abs(toY - fromY);
    let error = -dx / 2;
    const xstep = fromX < toX ? 1 : -1;
    const ystep = fromY < toY ? 1 : -1;

    let state = 0;
    const xLimit = toX + xstep;

    for (let x = fromX, y = fromY; x !== xLimit; x += xstep) {
      const realX = steep ? y : x;
      const realY = steep ? x : y;

      if ((state === 1) === this.image.get(realX, realY)) {
        if (state === 2)
          return MathUtils.distance(x, y, fromX, fromY);

        state++;
      }

      error += dy;

      if (error > 0) {
        if (y === toY)
          break;

        y += ystep;
        error -= dx;
      }
    }

    if (state === 2)
      return MathUtils.distance(toX + xstep, toY, fromX, fromY);

    return NaN;
  }

  protected getImage = () => this.image;

  protected getResultPointCallback = () => this.resultPointCallback;

  protected findAlignmentInRegion = (
    overallEstModuleSize: number,
    estAlignmentX: number,
    estAlignmentY: number,
    allowanceFactor: number
  ) => {
    const allowance = Math.floor(allowanceFactor * overallEstModuleSize);
    const alignmentAreaLeftX = Math.max(0, estAlignmentX - allowance);
    const alignmentAreaRightX = Math.min(this.image.getWidth() - 1, estAlignmentX + allowance);

    if (alignmentAreaRightX - alignmentAreaLeftX < overallEstModuleSize * 3)
      throw new NotFoundException('Alignment top exceeds estimated module size.');

    const alignmentAreaTopY = Math.max(0, estAlignmentY - allowance);
    const alignmentAreaBottomY = Math.min(this.image.getHeight() - 1, estAlignmentY + allowance);

    if (alignmentAreaBottomY - alignmentAreaTopY < overallEstModuleSize * 3)
      throw new NotFoundException('Alignment bottom exceeds estimated module size.');

    const alignmentFinder = new AlignmentPatternFinder(
      this.image,
      alignmentAreaLeftX,
      alignmentAreaTopY,
      alignmentAreaRightX - alignmentAreaLeftX,
      alignmentAreaBottomY - alignmentAreaTopY,
      overallEstModuleSize,
      this.resultPointCallback
    );

    return alignmentFinder.find();
  }

  protected calculateModuleSize = (
    topLeft: ResultPoint,
    topRight: ResultPoint,
    bottomLeft: ResultPoint
  ) => (this.calculateModuleSizeOneWay(topLeft, topRight) + this.calculateModuleSizeOneWay(topLeft, bottomLeft)) / 2.0;

  protected processFinderPatternInfo = (info: FinderPatternInfo) => {
    const topLeft: FinderPattern = info.getTopLeft();
    const topRight: FinderPattern = info.getTopRight();
    const bottomLeft: FinderPattern = info.getBottomLeft();

    const moduleSize = this.calculateModuleSize(topLeft, topRight, bottomLeft);

    if (moduleSize < 1.0)
      throw new NotFoundException('No pattern found in proccess finder.');

    const dimension = Detector.computeDimension(topLeft, topRight, bottomLeft, moduleSize);
    const provisionalVersion: Version = Version.getProvisionalVersionForDimension(dimension);
    const modulesBetweenFPCenters = provisionalVersion.getDimensionForVersion() - 7;

    let alignmentPattern: AlignmentPattern = null;

    if (provisionalVersion.getAlignmentPatternCenters().length > 0) {
      const bottomRightX = topRight.getX() - topLeft.getX() + bottomLeft.getX();
      const bottomRightY = topRight.getY() - topLeft.getY() + bottomLeft.getY();

      const correctionToTopLeft = 1.0 - 3.0 / modulesBetweenFPCenters;
      const estAlignmentX = Math.floor(topLeft.getX() + correctionToTopLeft * (bottomRightX - topLeft.getX()));
      const estAlignmentY = Math.floor(topLeft.getY() + correctionToTopLeft * (bottomRightY - topLeft.getY()));

      for (let i = 4; i <= 16; i <<= 1) {
        try {
          alignmentPattern = this.findAlignmentInRegion(
            moduleSize,
            estAlignmentX,
            estAlignmentY,
            i
          );

          break;
        } catch (re) {
          if (!(re instanceof NotFoundException)) {
            throw re;
          }
        }
      }
    }

    const transform: PerspectiveTransform =
      Detector.createTransform(topLeft, topRight, bottomLeft, alignmentPattern, dimension);

    const bits: BitMatrix = Detector.sampleGrid(this.image, transform, dimension);

    let points: ResultPoint[];

    if (alignmentPattern === null)
      points = [bottomLeft, topLeft, topRight];
    else
      points = [bottomLeft, topLeft, topRight, alignmentPattern];

    return new DetectorResult(bits, points);
  }

  detect = (hints: Map<DecodeHintType, any>) => {
    this.resultPointCallback = (hints === null || hints === undefined)
      ? null
      : hints.get(DecodeHintType.NEED_RESULT_POINT_CALLBACK);

    const finder = new FinderPatternFinder(this.image, this.resultPointCallback);
    const info = finder.find(hints);

    return this.processFinderPatternInfo(info);
  }
}
