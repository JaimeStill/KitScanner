import { BarcodeFormat } from './barcode-format';
import { ResultMetadataType } from './result-metadata-type';
import { ResultPoint } from './result-point';

import { System } from './util/system';

export class ReaderResult {
  private resultMetadata: Map<ResultMetadataType, Object>;

  public constructor(
    private text: string,
    private rawBytes: Uint8Array,
    private numBits: number = rawBytes == null ? 0 : 8 * rawBytes.length,
    private resultPoints: ResultPoint[],
    private format: BarcodeFormat,
    private timestamp: number = System.currentTimeMillis()
  ) {
    this.text = text;
    this.rawBytes = rawBytes;

    if (undefined === numBits || null === numBits)
      this.numBits = (rawBytes === null || rawBytes === undefined)
        ? 0
        : 8 * rawBytes.length;
    else
      this.numBits = numBits;

    this.resultPoints = resultPoints;
    this.format = format;
    this.resultMetadata = null;

    if (undefined === timestamp || null === timestamp)
      this.timestamp = System.currentTimeMillis();
    else
      this.timestamp = timestamp;
  }

  getText = () => this.text;

  getRawBytes = () => this.rawBytes;

  getNumBits = () => this.numBits;

  getResultPoints = () => this.resultPoints;

  getBarcodeFormat = () => this.format;

  getResultMetadata = () => this.resultMetadata;

  putMetadata = (type: ResultMetadataType, value: Object) => {
    if (this.resultMetadata === null) {
      this.resultMetadata = new Map<ResultMetadataType, Object>();
    }

    this.resultMetadata.set(type, value);
  }

  putAllMetadata = (metadata: Map<ResultMetadataType, Object>) => {
    if (metadata !== null) {
      if (this.resultMetadata === null) {
        this.resultMetadata = metadata;
      } else {
        this.resultMetadata = new Map(metadata);
      }
    }
  }

  addResultPoints = (newPoints: Array<ResultPoint>) => {
    const oldPoints = this.resultPoints;

    if (oldPoints === null)
      this.resultPoints = newPoints;
    else if (newPoints !== null && newPoints.length > 0) {
      const allPoints = new Array<ResultPoint>(oldPoints.length + newPoints.length);
      System.arraycopy(oldPoints, 0, allPoints, 0, oldPoints.length);
      System.arraycopy(newPoints, 0, allPoints, oldPoints.length, newPoints.length);
      this.resultPoints = allPoints;
    }
  }

  getTimestamp = () => this.timestamp;

  toString = () => this.text;
}
