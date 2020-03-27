import { Decoder } from './decoder/decoder';
import { QrCodeDecoderMetadata } from './decoder/qr-code-decoder-metadata';
import { Detector } from './detector/detector';
import { BarcodeFormat } from '../barcode-format';
import { BinaryBitmap } from '../binary-bitmap';
import { DecodeHintType } from '../decode-hint-type';
import { Reader } from '../reader';
import { ReaderResult } from '../reader-result';
import { ResultMetadataType } from '../result-metadata-type';
import { ResultPoint } from '../result-point';
import { BitMatrix } from '../common/bit-matrix';
import { DecoderResult } from '../common/decoder-result';
import { NotFoundException } from '../exception/not-found-exception';

export class QrCodeReader implements Reader {
  private static NO_POINTS = new Array<ResultPoint>();
  private decoder = new Decoder();

  private static extractPureBits = (image: BitMatrix) => {
    const leftTopBlack: Int32Array = image.getTopLeftOnBit();
    const rightBottomBlack: Int32Array = image.getBottomRightOnBit();

    if (leftTopBlack === null || rightBottomBlack === null)
      throw new NotFoundException();

    const moduleSize = QrCodeReader.moduleSize(leftTopBlack, image);

    let top = leftTopBlack[1];
    let bottom = rightBottomBlack[1];
    let left = leftTopBlack[0];
    let right = rightBottomBlack[0];

    if (left >= right || top >= bottom)
      throw new NotFoundException();

    if (bottom - top !== right - left) {
      right = left + (bottom - top);

      if (right >= image.getWidth())
        throw new NotFoundException();
    }

    const matrixWidth = Math.round((right - left + 1) / moduleSize);
    const matrixHeight = Math.round((bottom - top + 1) / moduleSize);

    if (matrixWidth <= 0 || matrixHeight <= 0)
      throw new NotFoundException();

    if (matrixHeight !== matrixWidth)
      throw new NotFoundException();

    const nudge = /*(int) */Math.floor(moduleSize / 2.0);
    top += nudge;
    left += nudge;

    const nudgedTooFarRight = left + /*(int) */Math.floor((matrixWidth - 1) * moduleSize) - right;

    if (nudgedTooFarRight > 0) {
      if (nudgedTooFarRight > nudge)
        throw new NotFoundException();

      left -= nudgedTooFarRight;
    }

    const nudgedTooFarDown = top + /*(int) */Math.floor((matrixHeight - 1) * moduleSize) - bottom;

    if (nudgedTooFarDown > 0) {
      if (nudgedTooFarDown > nudge)
        throw new NotFoundException();

      top -= nudgedTooFarDown;
    }

    const bits = new BitMatrix(matrixWidth, matrixHeight);

    for (let y = 0; y < matrixHeight; y++) {
      const iOffset = top + /*(int) */Math.floor(y * moduleSize);

      for (let x = 0; x < matrixWidth; x++)
        if (image.get(left + /*(int) */Math.floor(x * moduleSize), iOffset))
          bits.set(x, y);
    }

    return bits;
  }

  private static moduleSize = (leftTopBlack: Int32Array, image: BitMatrix) => {
    const height: number /*int*/ = image.getHeight();
    const width: number /*int*/ = image.getWidth();

    let x = leftTopBlack[0];
    let y = leftTopBlack[1];
    let inBlack = true;
    let transitions = 0;

    while (x < width && y < height) {
      if (inBlack !== image.get(x, y)) {
        if (++transitions === 5)
          break;

        inBlack = !inBlack;
      }

      x++;
      y++;
    }

    if (x === width || y === height)
      throw new NotFoundException();

    return (x - leftTopBlack[0]) / 7.0;
  }

  protected getDecoder = () => this.decoder;

  decode = (image: BinaryBitmap, hints?: Map<DecodeHintType, any>) => {
    let decoderResult: DecoderResult;
    let points: Array<ResultPoint>;

    if (hints !== undefined && hints !== null && undefined !== hints.get(DecodeHintType.PURE_BARCODE)) {
      const bits = QrCodeReader.extractPureBits(image.getBlackMatrix());
      decoderResult = this.decoder.decodeBitMatrix(bits, hints);
      points = QrCodeReader.NO_POINTS;
    } else {
      const detectorResult = new Detector(image.getBlackMatrix()).detect(hints);
      decoderResult = this.decoder.decodeBitMatrix(detectorResult.getBits(), hints);
      points = detectorResult.getPoints();
    }

    if (decoderResult.getOther() instanceof QrCodeDecoderMetadata)
      (<QrCodeDecoderMetadata>decoderResult.getOther()).applyMirroredCorrection(points);

    const result = new ReaderResult(decoderResult.getText(), decoderResult.getRawBytes(), undefined, points, BarcodeFormat.QR_CODE, undefined);
    const byteSegments: Array<Uint8Array> = decoderResult.getByteSegments();

    if (byteSegments !== null)
      result.putMetadata(ResultMetadataType.BYTE_SEGMENTS, byteSegments);

    const ecLevel: string = decoderResult.getEcLevel();

    if (ecLevel !== null)
      result.putMetadata(ResultMetadataType.ERROR_CORRECTION_LEVEL, ecLevel);

    if (decoderResult.hasStructuredAppend()) {
      result.putMetadata(
        ResultMetadataType.STRUCTURED_APPEND_SEQUENCE,
        decoderResult.getStructuredAppendSequenceNumber()
      );

      result.putMetadata(
        ResultMetadataType.STRUCTURED_APPEND_PARITY,
        decoderResult.getStructuredAppendParity()
      );
    }

    return result;
  }

  reset = () => { }
}
