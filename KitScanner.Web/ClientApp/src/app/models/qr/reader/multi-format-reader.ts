import { BinaryBitmap } from './binary-bitmap';
import { DecodeHintType } from './decode-hint-type';
import { QrCodeReader } from './qrcode/qr-code-reader';
import { Reader } from './reader';
import { ReaderResult } from './reader-result';

import { NotFoundException } from './exception/not-found-exception';
import { ReaderException } from './exception/reader-exception';

export class MultiFormatReader implements Reader {
  private hints: Map<DecodeHintType, any> | null;
  private readers: Reader[];

  decode = (image: BinaryBitmap, hints?: Map<DecodeHintType, any>) => {
    this.setHints(hints);
    return this.decodeInternal(image);
  }

  decodeWithState = (image: BinaryBitmap) => {
    if (!this.readers)
      this.setHints(null);

    return this.decodeInternal(image);
  }

  setHints = (hints?: Map<DecodeHintType, any> | null) => {
    this.hints = hints;
    this.readers = new Array<Reader>(new QrCodeReader());
  }

  reset = () => {
    if (this.readers !== null) {
      for (const reader of this.readers)
        reader.reset();
    }
  }

  private decodeInternal(image: BinaryBitmap): ReaderResult {
    if (this.readers === null)
      throw new ReaderException('No readers were selected, nothing can be read.');

    for (const reader of this.readers) {
      try {
        return reader.decode(image, this.hints);
      } catch (ex) {
        if (ex instanceof ReaderException) {
          continue;
        }
      }
    }

    throw new NotFoundException('No MultiFormat readers were able to detect the code.');
  }
}
