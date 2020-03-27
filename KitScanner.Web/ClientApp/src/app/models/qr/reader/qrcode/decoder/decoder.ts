import { BitMatrixParser } from './bit-matrix-parser';
import { DataBlock } from './data-block';
import { DecodedBitStreamParser } from './decoded-bit-stream-parser';
import { QrCodeDecoderMetadata } from './qr-code-decoder-metadata';
import { DecodeHintType } from '../../decode-hint-type';
import { BitMatrix } from '../../common/bit-matrix';
import { GenericGf } from '../../common/reed-solomon/generic-gf';
import { ReedSolomonDecoder } from '../../common/reed-solomon/reed-solomon-decoder';
import { ChecksumException } from '../../exception/checksum-exception';

export class Decoder {
  private rsDecoder: ReedSolomonDecoder;

  constructor() {
    this.rsDecoder = new ReedSolomonDecoder(GenericGf.QR_CODE_FIELD_256);
  }

  private correctErrors = (codewordBytes: Uint8Array, numDataCodewords: number) => {
    const codewordInts = new Int32Array(codewordBytes);

    try {
      this.rsDecoder.decode(codewordInts, codewordBytes.length - numDataCodewords);
    } catch {
      throw new ChecksumException();
    }

    for (let i = 0; i < numDataCodewords; i++)
      codewordBytes[i] = codewordInts[i];
  }

  private decodeBitMatrixParser = (parser: BitMatrixParser, hints: Map<DecodeHintType, any>) => {
    const version = parser.readVersion();

    const ecLevel = parser
      .readFormatInformation()
      .getErrorCorrectionLevel();

    const codewords = parser.readCodewords();
    const dataBlocks = DataBlock.getDataBlocks(codewords, version, ecLevel);

    let totalBytes = 0;

    for (const dataBlock of dataBlocks)
      totalBytes += dataBlock.getNumDataCodewords();

    const resultBytes = new Uint8Array(totalBytes);
    let resultOffset = 0;

    for (const dataBlock of dataBlocks) {
      const codewordBytes = dataBlock.getCodewords();
      const numDataCodewords = dataBlock.getNumDataCodewords();
      this.correctErrors(codewordBytes, numDataCodewords);

      for (let i = 0; i < numDataCodewords; i++)
        resultBytes[resultOffset++] = codewordBytes[i];
    }

    return DecodedBitStreamParser.decode(resultBytes, version, ecLevel, hints);
  }

  decodeBooleanArray = (image: boolean[][], hints?: Map<DecodeHintType, any>) =>
    this.decodeBitMatrix(BitMatrix.parseFromBooleanArray(image), hints);

  decodeBitMatrix = (bits: BitMatrix, hints?: Map<DecodeHintType, any>) => {
    const parser = new BitMatrixParser(bits);
    let ex = null;

    try {
      return this.decodeBitMatrixParser(parser, hints);
    } catch (e) {
      ex = e;
    }

    try {
      parser.remask();
      parser.setMirror(true);
      parser.readVersion();
      parser.readFormatInformation();
      parser.mirror();

      const result = this.decodeBitMatrixParser(parser, hints);
      result.setOther(new QrCodeDecoderMetadata(true));

      return result;
    } catch (e) {
      if (ex !== null)
        throw ex;

      throw e;
    }
  }
}
