import { BinaryBitmap } from './binary-bitmap';
import { DecodeHintType } from './decode-hint-type';
import { ReaderResult } from './reader-result';

export interface Reader {
  decode: (image: BinaryBitmap, hints?: Map<DecodeHintType, any> | null) => ReaderResult;
  reset(): void;
}
