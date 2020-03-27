import { BrowserCodeReader } from './browser-code-reader';
import { BinaryBitmap } from '../binary-bitmap';
import { DecodeHintType } from '../decode-hint-type';
import { MultiFormatReader } from '../multi-format-reader';
import { ReaderResult } from '../reader-result';

export class BrowserMultiFormatReader extends BrowserCodeReader {
  protected readonly reader: MultiFormatReader;

  constructor(
    hints: Map<DecodeHintType, any> = null,
    timeBetweenScansMillis: number = 500
  ) {
    super(new MultiFormatReader(), timeBetweenScansMillis, hints);
    this.reader.setHints(hints);
  }

  decodeBitmap = (binaryBitmap: BinaryBitmap): ReaderResult =>
    this.reader.decodeWithState(binaryBitmap);
}
