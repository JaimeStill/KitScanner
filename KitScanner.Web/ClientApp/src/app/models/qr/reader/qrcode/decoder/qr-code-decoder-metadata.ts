import { ResultPoint } from '../../result-point';

export class QrCodeDecoderMetadata {
  constructor(private mirrored: boolean) { }

  public isMirrored = () => this.mirrored;

  public applyMirroredCorrection(points: Array<ResultPoint>) {
    if (!this.mirrored || points === null || points.length < 3) return;

    const bottomLeft = points[0];
    points[0] = points[2];
    points[2] = bottomLeft;
  }
}
